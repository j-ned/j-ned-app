#!/usr/bin/env tsx
// Génère public/rss.xml (flux RSS 2.0) à partir des articles de blog publiés.
//
// Usage :
//   pnpm rss:build

import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const RSS_PATH = join(REPO_ROOT, 'public', 'rss.xml');
const PROD_API_URL = 'https://api.nedellec-julien.fr/api';

const { SITE_IDENTITY } = await import(
  resolve(REPO_ROOT, 'src/app/shared/identity/site-identity.static-data.ts')
);
const SITE_URL = SITE_IDENTITY.siteUrl;

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchPublishedPosts() {
  try {
    const res = await fetch(`${PROD_API_URL}/blog/posts`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`WARN: could not fetch blog posts for RSS (${err.message}). Feed will be empty.`);
    return [];
  }
}

const posts = await fetchPublishedPosts();

const items = posts
  .map(
    (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
      <description>${escapeXml(p.excerpt)}</description>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`,
  )
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Julien Nédellec — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Retours d'expérience Angular, NestJS, PostgreSQL et self-hosting.</description>
    <language>fr</language>
${items}
  </channel>
</rss>
`;

writeFileSync(RSS_PATH, rss);
console.log(`Built ${RSS_PATH} with ${posts.length} items.`);
