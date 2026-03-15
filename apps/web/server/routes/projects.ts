import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { project } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.js';
import { parsePagination } from '../lib/pagination.js';
import { uploadFile, deleteFile, buckets } from '../services/storage-client.js';

const projects = new Hono();

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Extract the S3 key from a value that may be a key, proxy path, or full URL */
function normalizeImageKey(value: string | undefined): string {
  if (!value) return '';
  // /images/projects/my-project.webp -> my-project.webp
  const proxyPrefix = '/images/projects/';
  if (value.startsWith(proxyPrefix)) return value.slice(proxyPrefix.length);
  // https://…/images/projects/my-project.webp -> my-project.webp
  const proxyIdx = value.indexOf(proxyPrefix);
  if (proxyIdx !== -1) return value.slice(proxyIdx + proxyPrefix.length);
  // https://garage-s3.j-ned.dev/img-projects/my-project.webp -> my-project.webp
  if (value.startsWith('http')) {
    const url = new URL(value);
    const parts = url.pathname.split('/');
    return parts[parts.length - 1];
  }
  return value;
}

/** Convert a raw S3 key into a proxy path (like img-about does for avatars) */
function resolveImageProxy(image: string | null): string {
  if (!image) return '';
  // Already a proxy path
  if (image.startsWith('/images/projects/')) return image;
  // Full URL — extract the filename
  if (image.startsWith('http')) {
    const parts = image.split('/');
    return `/images/projects/${parts[parts.length - 1]}`;
  }
  return `/images/projects/${image}`;
}

// GET /projects
projects.get('/', async (c) => {
  const query = c.req.query();
  const { page, limit } = parsePagination(query);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query['category']) {
    conditions.push(eq(project.category, query['category']));
  }
  if (query['featured'] === 'true') {
    conditions.push(eq(project.featured, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = query['_sort'] === 'createdAt'
    ? desc(project.createdAt)
    : asc(project.order);

  const [data, countResult] = await Promise.all([
    db.select().from(project).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(project).where(where),
  ]);

  return c.json({
    data: data.map((p) => ({ ...p, image: resolveImageProxy(p.image) })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /projects/categories
projects.get('/categories', async (c) => {
  const result = await db
    .select({
      name: project.category,
      count: sql<number>`count(*)::int`,
    })
    .from(project)
    .groupBy(project.category);

  return c.json(result);
});

// GET /projects/:id
projects.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [found] = await db.select().from(project).where(eq(project.id, id)).limit(1);

  if (!found) {
    return c.json({ error: 'Project not found' }, 404);
  }

  return c.json({ ...found, image: resolveImageProxy(found.image) });
});

// POST /projects
projects.post('/',
  authMiddleware,
  zValidator('json', createProjectSchema),
  async (c) => {
    const data = c.req.valid('json');
    const slug = slugify(data.title);
    const image = normalizeImageKey(data.image);

    const [created] = await db.insert(project).values({ ...data, slug, image }).returning();
    return c.json(created, 201);
  },
);

// PATCH /projects/:id
projects.patch('/:id',
  authMiddleware,
  zValidator('json', updateProjectSchema),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.title) {
      updates['slug'] = slugify(data.title);
    }
    if (data.image !== undefined) {
      updates['image'] = normalizeImageKey(data.image);
    }

    const [updated] = await db.update(project).set(updates).where(eq(project.id, id)).returning();

    if (!updated) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json(updated);
  },
);

// DELETE /projects/:id
projects.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(project).where(eq(project.id, id)).returning();

  if (!deleted) {
    return c.json({ error: 'Project not found' }, 404);
  }

  if (deleted.image) {
    try {
      await deleteFile(buckets.projects.bucket, deleted.image);
    } catch { /* ignore cleanup errors */ }
  }

  return c.json({ message: 'Project deleted' });
});

// POST /projects/:slug/image
projects.post('/:slug/image', authMiddleware, async (c) => {
  const slug = c.req.param('slug');
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
  const key = `${slug}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFile({
    bucket: buckets.projects.bucket,
    key,
    body: buffer,
    contentType: file.type,
  });

  return c.json({ key });
});

export default projects;
