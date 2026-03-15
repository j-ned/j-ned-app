import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { diploma } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createDiplomaSchema, updateDiplomaSchema } from '../schemas/profile.js';

const diplomas = new Hono();

diplomas.get('/', async (c) => {
  const data = await db.select().from(diploma);
  return c.json(data);
});

diplomas.get('/:id', async (c) => {
  const [found] = await db.select().from(diploma).where(eq(diploma.id, c.req.param('id'))).limit(1);
  if (!found) return c.json({ error: 'Diploma not found' }, 404);
  return c.json(found);
});

diplomas.post('/', authMiddleware, zValidator('json', createDiplomaSchema), async (c) => {
  const [created] = await db.insert(diploma).values(c.req.valid('json')).returning();
  return c.json(created, 201);
});

diplomas.patch('/:id', authMiddleware, zValidator('json', updateDiplomaSchema), async (c) => {
  const [updated] = await db.update(diploma)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(diploma.id, c.req.param('id')))
    .returning();
  if (!updated) return c.json({ error: 'Diploma not found' }, 404);
  return c.json(updated);
});

diplomas.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(diploma).where(eq(diploma.id, c.req.param('id'))).returning();
  if (!deleted) return c.json({ error: 'Diploma not found' }, 404);
  return c.json({ message: 'Diploma deleted' });
});

export default diplomas;
