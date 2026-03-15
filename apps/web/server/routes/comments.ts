import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { comment, article } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';
import { createCommentSchema, updateCommentSchema } from '../schemas/comment.js';
import { parsePagination } from '../lib/pagination.js';
import { sendCommentNotification } from '../services/mailer.js';

const comments = new Hono();

// GET /comments
comments.get('/', async (c) => {
  const query = c.req.query();
  const { page, limit } = parsePagination(query);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query['idArticle']) {
    conditions.push(eq(comment.articleId, query['idArticle']));
  }
  if (query['status']) {
    conditions.push(eq(comment.status, query['status']));
  }
  if (query['featured'] === 'true') {
    conditions.push(eq(comment.featured, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(comment).where(where).orderBy(desc(comment.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(comment).where(where),
  ]);

  return c.json({
    data,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// POST /comments
comments.post('/',
  rateLimiter({ windowMs: 60_000, max: 5 }),
  zValidator('json', createCommentSchema),
  async (c) => {
    const data = c.req.valid('json');

    const [created] = await db.insert(comment).values(data).returning();

    // Send notification (non-blocking)
    const [art] = await db.select({ title: article.title }).from(article).where(eq(article.id, data.articleId)).limit(1);
    if (art) {
      sendCommentNotification({
        author: data.author,
        content: data.content,
        articleTitle: art.title,
        email: data.email ?? '',
      }).catch(console.error);
    }

    return c.json(created, 201);
  },
);

// PATCH /comments/:id
comments.patch('/:id',
  authMiddleware,
  zValidator('json', updateCommentSchema),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const [updated] = await db.update(comment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(comment.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    return c.json(updated);
  },
);

// DELETE /comments/:id
comments.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(comment).where(eq(comment.id, id)).returning();

  if (!deleted) {
    return c.json({ error: 'Comment not found' }, 404);
  }

  return c.json({ message: 'Comment deleted' });
});

export default comments;
