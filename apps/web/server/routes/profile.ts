import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { profileInfo } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { updateProfileInfoSchema, updateBiographySchema } from '../schemas/profile.js';
import { uploadFile, getFile, listFiles, buckets } from '../services/storage-client.js';

const profile = new Hono();

// GET /profile
profile.get('/', async (c) => {
  const [info] = await db.select().from(profileInfo).limit(1);
  if (!info) {
    return c.json({ error: 'Profile not found' }, 404);
  }
  return c.json({
    ...info,
    avatarUrl: info.avatarUrl ? '/profile/avatar-image' : '',
  });
});

// PATCH /profile
profile.patch('/',
  authMiddleware,
  zValidator('json', updateProfileInfoSchema),
  async (c) => {
    const data = c.req.valid('json');
    const [existing] = await db.select().from(profileInfo).limit(1);

    if (!existing) {
      const [created] = await db.insert(profileInfo).values({
        displayName: data.displayName ?? '',
        location: data.location ?? '',
        ...data,
      }).returning();
      return c.json(created);
    }

    const [updated] = await db.update(profileInfo)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profileInfo.id, existing.id))
      .returning();

    return c.json(updated);
  },
);

// GET /profile/avatar-image — proxy S3 image
profile.get('/avatar-image', async (c) => {
  try {
    // Find the avatar file in the bucket
    const files = await listFiles(buckets.about.bucket, 'avatar');
    if (files.length === 0) {
      return c.json({ error: 'No avatar found' }, 404);
    }

    const key = files[0].Key!;
    const response = await getFile(buckets.about.bucket, key);
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return c.json({ error: 'File not found' }, 404);
    }

    return new Response(body, {
      headers: {
        'Content-Type': response.ContentType ?? 'image/webp',
        'Cache-Control': 'public, max-age=86400',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (err) {
    console.error('Avatar proxy error:', err);
    return c.json({ error: 'File not found' }, 404);
  }
});

// POST /profile/avatar
profile.post('/avatar', authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 5MB)' }, 400);
  }

  if (!file.type.startsWith('image/')) {
    return c.json({ error: 'Only image files are allowed' }, 400);
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const key = `avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFile({
    bucket: buckets.about.bucket,
    key,
    body: buffer,
    contentType: file.type,
  });

  const [existing] = await db.select().from(profileInfo).limit(1);
  if (existing) {
    await db.update(profileInfo)
      .set({ avatarUrl: key, updatedAt: new Date() })
      .where(eq(profileInfo.id, existing.id));
  }

  return c.json({ url: '/profile/avatar-image', fileName: key });
});

export default profile;

// Biography routes — reads/writes bio fields on profile_info
export const biographyRoutes = new Hono();

// GET /biography
biographyRoutes.get('/', async (c) => {
  const [info] = await db.select({
    title: profileInfo.bioTitle,
    paragraphs: profileInfo.bioParagraphs,
    updatedAt: profileInfo.updatedAt,
  }).from(profileInfo).limit(1);

  if (!info) {
    return c.json({ error: 'Biography not found' }, 404);
  }
  return c.json(info);
});

// PATCH /biography
biographyRoutes.patch('/',
  authMiddleware,
  zValidator('json', updateBiographySchema),
  async (c) => {
    const data = c.req.valid('json');
    const [existing] = await db.select().from(profileInfo).limit(1);

    if (!existing) {
      return c.json({ error: 'Profile not found, create profile first' }, 404);
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updates['bioTitle'] = data.title;
    if (data.paragraphs !== undefined) updates['bioParagraphs'] = data.paragraphs;

    const [updated] = await db.update(profileInfo)
      .set(updates)
      .where(eq(profileInfo.id, existing.id))
      .returning({
        title: profileInfo.bioTitle,
        paragraphs: profileInfo.bioParagraphs,
        updatedAt: profileInfo.updatedAt,
      });

    return c.json(updated);
  },
);
