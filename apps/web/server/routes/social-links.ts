import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { socialLink } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { createSocialLinkSchema, updateSocialLinkSchema } from '../schemas/profile.js';

const socialLinks = new Hono();

socialLinks.get('/', async (c) => {
  const data = await db.select().from(socialLink);
  return c.json(data);
});

socialLinks.get('/:id', async (c) => {
  const [found] = await db.select().from(socialLink).where(eq(socialLink.id, c.req.param('id'))).limit(1);
  if (!found) return c.json({ error: 'Social link not found' }, 404);
  return c.json(found);
});

socialLinks.post('/', authMiddleware, zValidator('json', createSocialLinkSchema), async (c) => {
  const [created] = await db.insert(socialLink).values(c.req.valid('json')).returning();
  return c.json(created, 201);
});

socialLinks.patch('/:id', authMiddleware, zValidator('json', updateSocialLinkSchema), async (c) => {
  const [updated] = await db.update(socialLink)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(socialLink.id, c.req.param('id')))
    .returning();
  if (!updated) return c.json({ error: 'Social link not found' }, 404);
  return c.json(updated);
});

socialLinks.delete('/:id', authMiddleware, async (c) => {
  const [deleted] = await db.delete(socialLink).where(eq(socialLink.id, c.req.param('id'))).returning();
  if (!deleted) return c.json({ error: 'Social link not found' }, 404);
  return c.json({ message: 'Social link deleted' });
});

export default socialLinks;
