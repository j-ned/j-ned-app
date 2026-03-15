import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { siteSettings } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';

const settings = new Hono();

// GET /settings — public, no auth needed
settings.get('/', async (c) => {
  let [row] = await db.select().from(siteSettings).limit(1);

  if (!row) {
    [row] = await db.insert(siteSettings).values({}).returning();
  }

  return c.json(row);
});

// PATCH /settings — admin only
settings.patch('/', authMiddleware, async (c) => {
  const data = await c.req.json<{ blogEnabled?: boolean }>();
  let [existing] = await db.select().from(siteSettings).limit(1);

  if (!existing) {
    [existing] = await db.insert(siteSettings).values({}).returning();
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.blogEnabled !== undefined) updates['blogEnabled'] = data.blogEnabled;

  const [updated] = await db
    .update(siteSettings)
    .set(updates)
    .where(eq(siteSettings.id, existing.id))
    .returning();

  return c.json(updated);
});

export default settings;
