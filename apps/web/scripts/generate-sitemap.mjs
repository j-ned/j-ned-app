#!/usr/bin/env tsx
// Génère public/sitemap.xml avant le build : routes statiques + une entrée par
// projet (récupérés depuis l'API prod), avec <lastmod> à la date du build.
//
// Usage :
//   pnpm sitemap:build

import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SITEMAP_PATH = join(REPO_ROOT, 'public', 'sitemap.xml');

// Même URL que celle inlinée dans app.config.ts pour le SSR (API_BASE_URL).
const PROD_API_URL = 'https://api.nedellec-julien.fr/api';

const { SITE_IDENTITY } = await import(
  resolve(REPO_ROOT, 'src/app/shared/identity/site-identity.static-data.ts')
);
const SITE_URL = SITE_IDENTITY.siteUrl;

const lastmod = new Date().toISOString().slice(0, 10);

const staticUrls = [
  { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/projects`, changefreq: 'weekly', priority: '0.9' },
  { loc: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.9' },
];

async function fetchProjectSlugs() {
  try {
    const res = await fetch(`${PROD_API_URL}/projects?_sort=order&limit=100`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const projects = await res.json();
    return projects.map((p) => p.slug);
  } catch (err) {
    console.warn(`WARN: could not fetch projects for sitemap (${err.message}).`);
    return [];
  }
}

async function fetchBlogPosts() {
  try {
    const res = await fetch(`${PROD_API_URL}/blog/posts`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`WARN: could not fetch blog posts for sitemap (${err.message}).`);
    return [];
  }
}

const [slugs, posts] = await Promise.all([fetchProjectSlugs(), fetchBlogPosts()]);

const projectUrls = slugs.map((slug) => ({
  loc: `${SITE_URL}/projects/${slug}`,
  changefreq: 'monthly',
  priority: '0.7',
}));

const blogUrls = posts.map((p) => ({
  loc: `${SITE_URL}/blog/${p.slug}`,
  changefreq: 'monthly',
  priority: '0.8',
  lastmod: p.publishedAt ? p.publishedAt.slice(0, 10) : lastmod,
}));

const allUrls = [...staticUrls, ...projectUrls, ...blogUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod ?? lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(SITEMAP_PATH, xml);
console.log(`Built ${SITEMAP_PATH} with ${allUrls.length} URLs (${projectUrls.length} projects, ${blogUrls.length} blog posts).`);
