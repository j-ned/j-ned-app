import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { hero, servicePricing, highlight, project } from '../db/schema';

const homeBundle = new Hono();

/** Single endpoint that returns all data needed for the landing page. */
homeBundle.get('/', async (c) => {
  const [heroResult, highlights, services, featuredProjects] = await Promise.all([
    db.select().from(hero).limit(1),
    db.select().from(highlight).where(eq(highlight.section, 'home')).orderBy(asc(highlight.order)),
    db.select().from(servicePricing).orderBy(asc(servicePricing.order)),
    db.select({
      id: project.id,
      title: project.title,
      category: project.category,
      tags: project.tags,
      description: project.description,
      image: project.image,
      liveUrl: project.liveUrl,
      repoUrl: project.repoUrl,
      repoUrlFront: project.repoUrlFront,
      repoUrlBack: project.repoUrlBack,
      featured: project.featured,
      order: project.order,
    })
      .from(project)
      .where(eq(project.featured, true))
      .orderBy(asc(project.order)),
  ]);

  // Resolve image proxy paths for projects
  const resolvedProjects = featuredProjects.map((p) => ({
    ...p,
    image: p.image
      ? p.image.startsWith('/images/projects/') ? p.image : `/images/projects/${p.image.startsWith('http') ? p.image.split('/').pop() : p.image}`
      : '',
  }));

  c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

  return c.json({
    hero: heroResult[0] ?? null,
    highlights,
    services,
    featuredProjects: resolvedProjects,
  });
});

export default homeBundle;