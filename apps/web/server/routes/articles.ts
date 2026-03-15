import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { article } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createArticleSchema, updateArticleSchema } from '../schemas/article.js';
import { uploadFile, deleteFile, buckets } from '../services/storage-client.js';

const articles = new Hono();

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Extract the S3 key from a value that may be a key, proxy path, or full URL */
function normalizeImageKey(value: string | undefined): string {
  if (!value) return '';
  const proxyPrefix = '/images/blog/';
  if (value.startsWith(proxyPrefix)) return value.slice(proxyPrefix.length);
  const proxyIdx = value.indexOf(proxyPrefix);
  if (proxyIdx !== -1) return value.slice(proxyIdx + proxyPrefix.length);
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
  if (image.startsWith('/images/blog/')) return image;
  if (image.startsWith('http')) {
    const parts = image.split('/');
    return `/images/blog/${parts[parts.length - 1]}`;
  }
  return `/images/blog/${image}`;
}

// GET /articles
articles.get('/', async (c) => {
  const query = c.req.query();
  const conditions = [];

  if (query['featured'] === 'true') {
    conditions.push(eq(article.featured, true));
  }
  if (query['id']) {
    conditions.push(eq(article.id, query['id']));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy = query['_sort'] === 'date' ? desc(article.date) : desc(article.createdAt);

  const data = await db.select().from(article).where(where).orderBy(orderBy);
  return c.json(data.map((a) => ({ ...a, image: resolveImageProxy(a.image) })));
});

// GET /articles/:id
articles.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [found] = await db.select().from(article).where(eq(article.id, id)).limit(1);

  if (!found) {
    return c.json({ error: 'Article not found' }, 404);
  }

  return c.json({ ...found, image: resolveImageProxy(found.image) });
});

// POST /articles
articles.post('/',
  authMiddleware,
  zValidator('json', createArticleSchema),
  async (c) => {
    const data = c.req.valid('json');
    const slug = slugify(data.title);
    const image = normalizeImageKey(data.image);

    const [created] = await db.insert(article).values({ ...data, slug, image }).returning();
    return c.json(created, 201);
  },
);

// PATCH /articles/:id
articles.patch('/:id',
  authMiddleware,
  zValidator('json', updateArticleSchema),
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

    const [updated] = await db.update(article).set(updates).where(eq(article.id, id)).returning();

    if (!updated) {
      return c.json({ error: 'Article not found' }, 404);
    }

    return c.json(updated);
  },
);

// DELETE /articles/:id
articles.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(article).where(eq(article.id, id)).returning();

  if (!deleted) {
    return c.json({ error: 'Article not found' }, 404);
  }

  if (deleted.image) {
    try {
      await deleteFile(buckets.blog.bucket, deleted.image);
    } catch { /* ignore */ }
  }

  return c.json({ message: 'Article deleted' });
});

// POST /articles/:slug/image
articles.post('/:slug/image', authMiddleware, async (c) => {
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
    bucket: buckets.blog.bucket,
    key,
    body: buffer,
    contentType: file.type,
  });

  return c.json({ key });
});

export default articles;
