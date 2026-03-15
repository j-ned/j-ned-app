import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { highlight } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createHighlightSchema, updateHighlightSchema } from '../schemas/profile.js';

const highlights = new Hono();

const profileFilter = eq(highlight.section, 'profile');

highlights.get('/', async (c) => {
  const data = await db.select().from(highlight).where(profileFilter);
  return c.json(data);
});

highlights.get('/:id', async (c) => {
  const [found] = await db.select().from(highlight)
    .where(and(eq(highlight.id, c.req.param('id')), profileFilter))
    .limit(1);
  if (!found) return c.json({ error: 'Highlight not found' }, 404);
  return c.json(found);
});

highlights.post('/', authMiddleware, zValidator('json', createHighlightSchema), async (c) => {
  const [created] = await db.insert(highlight)
    .values({ ...c.req.valid('json'), section: 'profile' })
    .returning();
  return c.json(created, 201);
});

highlights.patch('/:id', authMiddleware, zValidator('json', updateHighlightSchema), async (c) => {
  const [updated] = await db.update(highlight)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(and(eq(highlight.id, c.req.param('id')), profileFilter))
    .returning();
  if (!updated) return c.json({ error: 'Highlight not found' }, 404);
  return c.json(updated);
});

highlights.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(highlight)
    .where(and(eq(highlight.id, c.req.param('id')), profileFilter))
    .returning();
  if (!deleted) return c.json({ error: 'Highlight not found' }, 404);
  return c.json({ message: 'Highlight deleted' });
});

export default highlights;
