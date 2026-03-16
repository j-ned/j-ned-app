import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, asc, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { hero, servicePricing, highlight } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import {
  updateHeroSchema,
  createServicePricingSchema, updateServicePricingSchema,
  createHomeHighlightSchema, updateHomeHighlightSchema,
} from '../schemas/home.js';

// Hero routes
export const heroRoutes = new Hono();

heroRoutes.get('/', async (c) => {
  const [data] = await db.select().from(hero).limit(1);
  if (!data) return c.json({ error: 'Hero data not found' }, 404);
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return c.json(data);
});

heroRoutes.patch('/', authMiddleware, zValidator('json', updateHeroSchema), async (c) => {
  const data = c.req.valid('json');
  const [existing] = await db.select().from(hero).limit(1);

  if (!existing) {
    const [created] = await db.insert(hero).values({
      name: data.name ?? '',
      tagline: data.tagline ?? '',
      availability: data.availability ?? '',
    }).returning();
    return c.json(created);
  }

  const [updated] = await db.update(hero)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(hero.id, existing.id))
    .returning();

  return c.json(updated);
});

// Service Pricing routes
export const servicePricingRoutes = new Hono();

servicePricingRoutes.get('/', async (c) => {
  const data = await db.select().from(servicePricing).orderBy(asc(servicePricing.order));
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return c.json(data);
});

servicePricingRoutes.get('/:id', async (c) => {
  const [found] = await db.select().from(servicePricing).where(eq(servicePricing.id, c.req.param('id'))).limit(1);
  if (!found) return c.json({ error: 'Service pricing not found' }, 404);
  return c.json(found);
});

servicePricingRoutes.post('/', authMiddleware, zValidator('json', createServicePricingSchema), async (c) => {
  const [created] = await db.insert(servicePricing).values(c.req.valid('json')).returning();
  return c.json(created, 201);
});

servicePricingRoutes.patch('/:id', authMiddleware, zValidator('json', updateServicePricingSchema), async (c) => {
  const [updated] = await db.update(servicePricing)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(servicePricing.id, c.req.param('id')))
    .returning();
  if (!updated) return c.json({ error: 'Service pricing not found' }, 404);
  return c.json(updated);
});

servicePricingRoutes.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(servicePricing).where(eq(servicePricing.id, c.req.param('id'))).returning();
  if (!deleted) return c.json({ error: 'Service pricing not found' }, 404);
  return c.json({ message: 'Service pricing deleted' });
});

// Home Highlights routes — uses highlight table with section='home'
export const homeHighlightRoutes = new Hono();

const homeFilter = eq(highlight.section, 'home');

homeHighlightRoutes.get('/', async (c) => {
  const data = await db.select().from(highlight).where(homeFilter).orderBy(asc(highlight.order));
  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return c.json(data);
});

homeHighlightRoutes.get('/:id', async (c) => {
  const [found] = await db.select().from(highlight)
    .where(and(eq(highlight.id, c.req.param('id')), homeFilter))
    .limit(1);
  if (!found) return c.json({ error: 'Home highlight not found' }, 404);
  return c.json(found);
});

homeHighlightRoutes.post('/', authMiddleware, zValidator('json', createHomeHighlightSchema), async (c) => {
  const [created] = await db.insert(highlight)
    .values({ ...c.req.valid('json'), section: 'home' })
    .returning();
  return c.json(created, 201);
});

homeHighlightRoutes.patch('/:id', authMiddleware, zValidator('json', updateHomeHighlightSchema), async (c) => {
  const [updated] = await db.update(highlight)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(and(eq(highlight.id, c.req.param('id')), homeFilter))
    .returning();
  if (!updated) return c.json({ error: 'Home highlight not found' }, 404);
  return c.json(updated);
});

homeHighlightRoutes.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(highlight)
    .where(and(eq(highlight.id, c.req.param('id')), homeFilter))
    .returning();
  if (!deleted) return c.json({ error: 'Home highlight not found' }, 404);
  return c.json({ message: 'Home highlight deleted' });
});
