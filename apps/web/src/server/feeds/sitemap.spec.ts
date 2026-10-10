import { describe, expect, it } from 'vitest';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { OFFERS_BASE_PATH, offerPath } from '@features/offer/domain/offer-path';
import { buildSitemap, type SitemapInput } from './sitemap';

const SITE = 'https://nedellec-julien.fr';
const STARTED_AT = new Date('2026-10-10T06:30:00Z');

type Entry = { readonly loc: string; readonly lastmod: string };

function entriesOf(xml: string): readonly Entry[] {
  return [...xml.matchAll(/<url>\s*<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)].map(
    ([, loc, lastmod]) => ({ loc, lastmod }),
  );
}

function aSitemapInput(overrides: Partial<SitemapInput> = {}): SitemapInput {
  return { projectSlugs: [], posts: [], staticLastmod: STARTED_AT, ...overrides };
}

describe('buildSitemap', () => {
  it('Given projects and articles When the sitemap is built Then it lists the static pages, the offers, the projects and the articles in that order', () => {
    const xml = buildSitemap(
      aSitemapInput({
        projectSlugs: ['dashflow', 'candidash'],
        posts: [makeBlogPost({ slug: 'article-temoin' })],
      }),
    );

    expect(entriesOf(xml).map((entry) => entry.loc)).toEqual([
      `${SITE}/`,
      `${SITE}/about`,
      `${SITE}/projects`,
      `${SITE}/blog`,
      `${SITE}/mentions-legales`,
      `${SITE}/confidentialite`,
      `${SITE}/${OFFERS_BASE_PATH}`,
      ...OFFERS.map(({ slug }) => `${SITE}${offerPath(slug)}`),
      `${SITE}/projects/dashflow`,
      `${SITE}/projects/candidash`,
      `${SITE}/blog/article-temoin`,
    ]);
  });

  it('Given a project When the sitemap is built Then its entry is dated by the server start, monthly, priority 0.7, inside the sitemap namespace', () => {
    const xml = buildSitemap(aSitemapInput({ projectSlugs: ['dashflow'] }));

    expect({
      head: xml.startsWith(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
      ),
      project: xml.includes(
        `  <url>\n    <loc>${SITE}/projects/dashflow</loc>\n    <lastmod>2026-10-10</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
      ),
      end: xml.endsWith('</urlset>\n'),
    }).toEqual({ head: true, project: true, end: true });
  });

  it('Given no content When the sitemap is built Then every static page is dated by the server start', () => {
    const lastmods = entriesOf(buildSitemap(aSitemapInput())).map((entry) => entry.lastmod);

    expect(lastmods).toEqual(Array.from({ length: 7 + OFFERS.length }, () => '2026-10-10'));
  });

  it.each([
    ['edited after publication', '2026-09-01T10:00:00Z', '2026-09-20T08:00:00Z', '2026-09-20'],
    ['published after its last edit', '2026-09-25T10:00:00Z', '2026-09-20T08:00:00Z', '2026-09-25'],
    ['never published', null, '2026-09-12T08:00:00Z', '2026-09-12'],
  ])(
    'Given an article %s When the sitemap is built Then its lastmod is the latest of both dates',
    (_label, publishedAt, updatedAt, lastmod) => {
      const xml = buildSitemap(
        aSitemapInput({
          posts: [makeBlogPost({ slug: 'article-temoin', publishedAt, updatedAt })],
        }),
      );

      expect(entriesOf(xml).at(-1)).toEqual({ loc: `${SITE}/blog/article-temoin`, lastmod });
    },
  );

  it('Given a slug with XML special characters When the sitemap is built Then its url is escaped', () => {
    const xml = buildSitemap(aSitemapInput({ posts: [makeBlogPost({ slug: 'r&d<2026>' })] }));

    expect(entriesOf(xml).at(-1)?.loc).toBe(`${SITE}/blog/r&amp;d&lt;2026&gt;`);
  });
});
