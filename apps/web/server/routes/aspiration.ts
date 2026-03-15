import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { expertise } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createAspirationSchema, updateAspirationSchema } from '../schemas/profile.js';

const aspirationRoutes = new Hono();

const seekFilter = eq(expertise.type, 'seek');

aspirationRoutes.get('/', async (c) => {
  const data = await db.select().from(expertise).where(seekFilter);
  return c.json(data);
});

aspirationRoutes.get('/:id', async (c) => {
  const [found] = await db.select().from(expertise)
    .where(and(eq(expertise.id, c.req.param('id')), seekFilter))
    .limit(1);
  if (!found) return c.json({ error: 'Aspiration not found' }, 404);
  return c.json(found);
});

aspirationRoutes.post('/', authMiddleware, zValidator('json', createAspirationSchema), async (c) => {
  const [created] = await db.insert(expertise)
    .values({ ...c.req.valid('json'), type: 'seek' })
    .returning();
  return c.json(created, 201);
});

aspirationRoutes.patch('/:id', authMiddleware, zValidator('json', updateAspirationSchema), async (c) => {
  const [updated] = await db.update(expertise)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(and(eq(expertise.id, c.req.param('id')), seekFilter))
    .returning();
  if (!updated) return c.json({ error: 'Aspiration not found' }, 404);
  return c.json(updated);
});

aspirationRoutes.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(expertise)
    .where(and(eq(expertise.id, c.req.param('id')), seekFilter))
    .returning();
  if (!deleted) return c.json({ error: 'Aspiration not found' }, 404);
  return c.json({ message: 'Aspiration deleted' });
});

export default aspirationRoutes;
