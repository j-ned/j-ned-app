import { Hono } from 'hono';
import { desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { project } from '../db/schema';
import { env } from '../lib/env.js';

const sitemap = new Hono();

type UrlEntry = {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
};

function toUrlElement(entry: UrlEntry): string {
  return `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

function toIsoDate(date: Date | string | null): string {
  if (!date) return new Date().toISOString().slice(0, 10);
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

// GET /sitemap.xml
sitemap.get('/', async (c) => {
  const base = env.FRONTEND_URL;
  const today = new Date().toISOString().slice(0, 10);

  const staticRoutes: UrlEntry[] = [
    { loc: `${base}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${base}/about`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${base}/projects`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${base}/contact`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { loc: `${base}/booking`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
  ];

  const projects = await db
    .select({ slug: project.slug, updatedAt: project.updatedAt })
    .from(project)
    .orderBy(desc(project.updatedAt))
    .catch(() => []);

  const projectRoutes: UrlEntry[] = projects.map((p) => ({
    loc: `${base}/projects/${p.slug}`,
    lastmod: toIsoDate(p.updatedAt),
    changefreq: 'monthly',
    priority: '0.7',
  }));

  const allUrls = [...staticRoutes, ...projectRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(toUrlElement).join('\n')}
</urlset>`;

  return c.text(xml, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});

export default sitemap;
