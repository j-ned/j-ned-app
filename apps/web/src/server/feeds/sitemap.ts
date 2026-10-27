import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { escapeXml } from './xml-escape';

export type SitemapPost = Pick<BlogPost, 'slug' | 'publishedAt' | 'updatedAt'>;

export type SitemapInput = {
  readonly projectSlugs: readonly string[];
  readonly posts: readonly SitemapPost[];
  readonly insertGuideEnabled: boolean;
  readonly insertDecoderEnabled: boolean;
  readonly staticLastmod: Date;
};

type SitemapUrl = {
  readonly path: string;
  readonly changefreq: 'weekly' | 'monthly' | 'yearly';
  readonly priority: string;
  readonly lastmod?: string;
};

// Interrupteur éteint : la page répond 404, elle sort donc du sitemap.
const INSERT_GUIDE_URL: SitemapUrl = {
  path: '/atelier/plaquettes',
  changefreq: 'monthly',
  priority: '0.7',
};
const INSERT_DECODER_URL: SitemapUrl = {
  path: '/atelier/decodeur',
  changefreq: 'monthly',
  priority: '0.7',
};

const STATIC_URLS: readonly SitemapUrl[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/atelier', changefreq: 'monthly', priority: '0.8' },
  INSERT_GUIDE_URL,
  INSERT_DECODER_URL,
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/mentions-legales', changefreq: 'yearly', priority: '0.2' },
  { path: '/confidentialite', changefreq: 'yearly', priority: '0.2' },
];

const toDay = (iso: string): string => iso.slice(0, 10);

// Dernière retouche éditoriale, jamais avant la publication (un like ne touche pas updatedAt).
const postLastmod = ({ publishedAt, updatedAt }: SitemapPost): string =>
  toDay([updatedAt, publishedAt ?? ''].sort().at(-1) ?? updatedAt);

export function buildSitemap({
  projectSlugs,
  posts,
  insertGuideEnabled,
  insertDecoderEnabled,
  staticLastmod,
}: SitemapInput): string {
  const defaultLastmod = toDay(staticLastmod.toISOString());
  const switchedOff = new Set<SitemapUrl>([
    ...(insertGuideEnabled ? [] : [INSERT_GUIDE_URL]),
    ...(insertDecoderEnabled ? [] : [INSERT_DECODER_URL]),
  ]);
  const urls: readonly SitemapUrl[] = [
    ...STATIC_URLS.filter((url) => !switchedOff.has(url)),
    ...projectSlugs.map((slug): SitemapUrl => ({
      path: `/projects/${slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    ...posts.map((post): SitemapUrl => ({
      path: `/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: postLastmod(post),
    })),
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
