import { Hono } from 'hono';
import { db } from '../db/client.js';
import { siteSettings } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';

const settings = new Hono();

// GET /settings — public, no auth needed
settings.get('/', async (c) => {
  // UPSERT: ensure the singleton row always exists
  const [row] = await db.insert(siteSettings)
    .values({})
    .onConflictDoNothing()
    .returning();

  // If onConflictDoNothing returned nothing, the row already exists
  if (!row) {
    const [existing] = await db.select().from(siteSettings).limit(1);
    c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return c.json(existing);
  }

  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  return c.json(row);
});

// PATCH /settings — admin only
settings.patch('/', authMiddleware, async (c) => {
  const data = await c.req.json<{ blogEnabled?: boolean }>();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.blogEnabled !== undefined) updates['blogEnabled'] = data.blogEnabled;

  // UPSERT: insert default then update in one go
  const [upserted] = await db.insert(siteSettings)
    .values({})
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: updates,
    })
    .returning();

  return c.json(upserted);
});

export default settings;
