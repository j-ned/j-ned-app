#!/usr/bin/env tsx
// Génère public/rss.xml (flux RSS 2.0) à partir des articles de blog publiés : texte intégral
// (`content:encoded`), auteur, catégories, couverture en `enclosure`, `atom:link rel="self"`.
//
// Usage :
//   pnpm rss:build

import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fetchPublicJson } from './fetch-public-json.mjs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const RSS_PATH = join(REPO_ROOT, 'public', 'rss.xml');
const PROD_API_URL = 'https://api.nedellec-julien.fr/api';
const AUTHOR = 'Julien Nédellec';

const { SITE_IDENTITY } = await import(
  resolve(REPO_ROOT, 'src/app/shared/identity/site-identity.static-data.ts')
);
// Même rendu que la page article (marked + DOMPurify sur jsdom) : le HTML du flux est assaini.
const { parseMarkdown } = await import(
  resolve(REPO_ROOT, 'src/app/features/blog/infra/parse-markdown.ts')
);
const { toShareImageUrl } = await import(resolve(REPO_ROOT, 'src/app/shared/seo/share-image.ts'));
const SITE_URL = SITE_IDENTITY.siteUrl;
const FEED_URL = `${SITE_URL}/rss.xml`;

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Un `]]>` dans le HTML fermerait la section CDATA : on la scinde autour.
function cdata(html) {
  return html.replaceAll(']]>', ']]]]><![CDATA[>');
}

// Même résolution que `HttpBlogGateway.resolvePost` (clé relative à la racine de l'API), puis la
// carte de partage JPEG (`toShareImageUrl`) : les agrégateurs affichent l'enclosure en vignette
// et ne décodent pas tous l'AVIF.
function resolveCoverUrl(coverImage) {
  if (!coverImage) return null;
  const url = coverImage.startsWith('http') ? coverImage : `${PROD_API_URL}${coverImage}`;
  return toShareImageUrl(url);
}

// RSS 2.0 exige `length` et `type` sur <enclosure> : une réponse HEAD les donne sans télécharger.
async function fetchEnclosure(url) {
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) throw new Error(`Build: ${url} answered HTTP ${res.status}, build aborted`);
  const type = res.headers.get('content-type');
  const length = res.headers.get('content-length');
  if (!type || !length) throw new Error(`Build: ${url} has no content-type/length, build aborted`);
  return { url, type, length };
}

async function toItem(p) {
  const link = `${SITE_URL}/blog/${p.slug}`;
  const coverUrl = resolveCoverUrl(p.coverImage);
  const enclosure = coverUrl ? await fetchEnclosure(coverUrl) : null;
  const categories = p.tags.map((t) => `      <category>${escapeXml(t)}</category>`);
  return [
    '    <item>',
    `      <title>${escapeXml(p.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    `      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>`,
    `      <dc:creator>${escapeXml(AUTHOR)}</dc:creator>`,
    ...categories,
    `      <description>${escapeXml(p.excerpt)}</description>`,
    `      <content:encoded><![CDATA[${cdata(parseMarkdown(p.contentMarkdown))}]]></content:encoded>`,
    ...(enclosure
      ? [
          `      <enclosure url="${enclosure.url}" length="${enclosure.length}" type="${enclosure.type}" />`,
        ]
      : []),
    '    </item>',
  ].join('\n');
}

const posts = await fetchPublicJson(`${PROD_API_URL}/blog/posts`);
const items = await Promise.all(posts.map(toItem));
const lastBuildDate = new Date().toUTCString();

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${AUTHOR} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
    <description>Retours d'expérience Angular, NestJS, PostgreSQL et self-hosting.</description>
    <language>fr</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;

writeFileSync(RSS_PATH, rss);
console.log(`Built ${RSS_PATH} with ${posts.length} items.`);
