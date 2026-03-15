import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { technology } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createTechnologySchema, updateTechnologySchema } from '../schemas/profile.js';

const technologies = new Hono();

technologies.get('/', async (c) => {
  const data = await db.select().from(technology);
  return c.json(data);
});

technologies.get('/:id', async (c) => {
  const [found] = await db.select().from(technology).where(eq(technology.id, c.req.param('id'))).limit(1);
  if (!found) return c.json({ error: 'Technology not found' }, 404);
  return c.json(found);
});

technologies.post('/', authMiddleware, zValidator('json', createTechnologySchema), async (c) => {
  const [created] = await db.insert(technology).values(c.req.valid('json')).returning();
  return c.json(created, 201);
});

technologies.patch('/:id', authMiddleware, zValidator('json', updateTechnologySchema), async (c) => {
  const [updated] = await db.update(technology)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(technology.id, c.req.param('id')))
    .returning();
  if (!updated) return c.json({ error: 'Technology not found' }, 404);
  return c.json(updated);
});

technologies.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(technology).where(eq(technology.id, c.req.param('id'))).returning();
  if (!deleted) return c.json({ error: 'Technology not found' }, 404);
  return c.json({ message: 'Technology deleted' });
});

export default technologies;
