import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { contactMessage } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';
import { createContactSchema } from '../schemas/contact.js';
import { parsePagination } from '../lib/pagination.js';
import { env } from '../lib/env.js';
import { sendContactNotification, sendContactConfirmation } from '../services/mailer.js';

const contact = new Hono();

// GET /contact/info
contact.get('/info', (c) => {
  return c.json({
    email: env.CONTACT_EMAIL,
    phone: env.CONTACT_PHONE,
    address: env.CONTACT_LOCATION,
  });
});

// POST /contact/messages
contact.post('/messages',
  rateLimiter({ windowMs: 60_000, max: 5 }),
  zValidator('json', createContactSchema),
  async (c) => {
    const data = c.req.valid('json');

    await db.insert(contactMessage).values(data);

    // Send emails (non-blocking)
    Promise.all([
      sendContactNotification(data),
      sendContactConfirmation(data),
    ]).catch(console.error);

    return c.json({ success: true, message: 'Message envoyé avec succès.' }, 201);
  },
);

// GET /contact/messages
contact.get('/messages', authMiddleware, async (c) => {
  const query = c.req.query();
  const { page, limit } = parsePagination(query);
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db.select().from(contactMessage).orderBy(desc(contactMessage.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(contactMessage),
  ]);

  return c.json({
    data,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

// GET /contact/messages/unread-count
contact.get('/messages/unread-count', authMiddleware, async (c) => {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessage)
    .where(eq(contactMessage.read, false));

  return c.json({ count: result?.count ?? 0 });
});

// PATCH /contact/messages/:id/read
contact.patch('/messages/:id/read', authMiddleware, async (c) => {
  const id = c.req.param('id');

  const [updated] = await db.update(contactMessage)
    .set({ read: true })
    .where(eq(contactMessage.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Message not found' }, 404);
  }

  return c.json(updated);
});

// DELETE /contact/messages/:id
contact.delete('/messages/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db.delete(contactMessage).where(eq(contactMessage.id, id)).returning();

  if (!deleted) {
    return c.json({ error: 'Message not found' }, 404);
  }

  return c.json({ message: 'Message deleted' });
});

export default contact;
