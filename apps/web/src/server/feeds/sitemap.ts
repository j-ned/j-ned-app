import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { OFFERS_BASE_PATH, offerPath } from '@features/offer/domain/offer-path';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { escapeXml } from './xml-escape';

export type SitemapPost = Pick<BlogPost, 'slug' | 'publishedAt' | 'updatedAt'>;

export type SitemapInput = {
  readonly projectSlugs: readonly string[];
  readonly posts: readonly SitemapPost[];
  readonly staticLastmod: Date;
};

type SitemapUrl = {
  readonly path: string;
  readonly changefreq: 'weekly' | 'monthly' | 'yearly';
  readonly priority: string;
  readonly lastmod?: string;
};

const STATIC_URLS: readonly SitemapUrl[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/mentions-legales', changefreq: 'yearly', priority: '0.2' },
  { path: '/confidentialite', changefreq: 'yearly', priority: '0.2' },
  { path: `/${OFFERS_BASE_PATH}`, changefreq: 'monthly', priority: '0.8' },
  ...OFFERS.map(
    ({ slug }): SitemapUrl => ({
      path: offerPath(slug),
      changefreq: 'monthly',
      priority: '0.7',
    }),
  ),
];

const toDay = (iso: string): string => iso.slice(0, 10);

// Dernière retouche éditoriale, jamais avant la publication (un like ne touche pas updatedAt).
const postLastmod = ({ publishedAt, updatedAt }: SitemapPost): string =>
  toDay([updatedAt, publishedAt ?? ''].sort().at(-1) ?? updatedAt);

export function buildSitemap({ projectSlugs, posts, staticLastmod }: SitemapInput): string {
  const defaultLastmod = toDay(staticLastmod.toISOString());
  const urls: readonly SitemapUrl[] = [
    ...STATIC_URLS,
    ...projectSlugs.map(
      (slug): SitemapUrl => ({
        path: `/projects/${slug}`,
        changefreq: 'monthly',
        priority: '0.7',
      }),
    ),
    ...posts.map(
      (post): SitemapUrl => ({
        path: `/blog/${post.slug}`,
        changefreq: 'monthly',
        priority: '0.8',
        lastmod: postLastmod(post),
      }),
    ),
  ];
  const entries = urls.map(
    (url) => `  <url>
    <loc>${escapeXml(`${SITE_IDENTITY.siteUrl}${url.path}`)}</loc>
    <lastmod>${url.lastmod ?? defaultLastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}
