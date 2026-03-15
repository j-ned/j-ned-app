import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { expertise } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createExpertiseSchema, updateExpertiseSchema } from '../schemas/profile.js';

const expertises = new Hono();

const offerFilter = eq(expertise.type, 'offer');

expertises.get('/', async (c) => {
  const data = await db.select().from(expertise).where(offerFilter);
  return c.json(data);
});

expertises.get('/:id', async (c) => {
  const [found] = await db.select().from(expertise)
    .where(and(eq(expertise.id, c.req.param('id')), offerFilter))
    .limit(1);
  if (!found) return c.json({ error: 'Expertise not found' }, 404);
  return c.json(found);
});

expertises.post('/', authMiddleware, zValidator('json', createExpertiseSchema), async (c) => {
  const [created] = await db.insert(expertise)
    .values({ ...c.req.valid('json'), type: 'offer' })
    .returning();
  return c.json(created, 201);
});

expertises.patch('/:id', authMiddleware, zValidator('json', updateExpertiseSchema), async (c) => {
  const [updated] = await db.update(expertise)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(and(eq(expertise.id, c.req.param('id')), offerFilter))
    .returning();
  if (!updated) return c.json({ error: 'Expertise not found' }, 404);
  return c.json(updated);
});

expertises.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(expertise)
    .where(and(eq(expertise.id, c.req.param('id')), offerFilter))
    .returning();
  if (!deleted) return c.json({ error: 'Expertise not found' }, 404);
  return c.json({ message: 'Expertise deleted' });
});

export default expertises;
