import { describe, expect, it } from 'vitest';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { buildRss, escapeCdata, type RssEnclosure, type RssItem } from './rss';

const SITE = 'https://nedellec-julien.fr';
const BUILT_AT = new Date('2026-10-10T21:00:00Z');
const COVER: RssEnclosure = {
  url: `${SITE}/api/storage/portfolio-storage/blog/c-1a2b3c4d.avif?variant=share`,
  type: 'image/jpeg',
  length: '48213',
};

function anItem(overrides: Partial<RssItem> = {}): RssItem {
  return { post: makeBlogPost({ slug: 'angular-signaux' }), enclosure: null, ...overrides };
}

const itemsOf = (xml: string): readonly string[] =>
  [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map(([item]) => item);

const linesOf = (block: string): readonly string[] => block.split('\n').map((line) => line.trim());

const encodedContentOf = (xml: string): string | null =>
  /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/.exec(xml)?.[1] ?? null;

const count = (xml: string, fragment: string): number => xml.split(fragment).length - 1;

describe('buildRss', () => {
  it('Given a build time When the feed is built Then the channel names the blog, points to itself and carries that time', () => {
    const lines = linesOf(buildRss([anItem()], BUILT_AT));

    expect(lines.slice(0, 10)).toEqual([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
      '<channel>',
      '<title>Julien Nédellec — Blog</title>',
      `<link>${SITE}/blog</link>`,
      `<atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />`,
      "<description>Retours d'expérience Angular, NestJS, PostgreSQL et self-hosting.</description>",
      '<language>fr</language>',
      '<lastBuildDate>Sat, 10 Oct 2026 21:00:00 GMT</lastBuildDate>',
      '<item>',
    ]);
  });

  it('Given an article When the feed is built Then its item carries the escaped title, the permalink, the date, the author, the tags and the excerpt', () => {
    const xml = buildRss(
      [
        anItem({
          post: makeBlogPost({
            slug: 'angular-signaux',
            title: 'Angular & signaux <v22>',
            excerpt: "L'essentiel",
            tags: ['Angular', 'SSR & SEO'],
            publishedAt: '2026-10-01T08:00:00Z',
          }),
        }),
      ],
      BUILT_AT,
    );

    expect(linesOf(itemsOf(xml)[0] ?? '').slice(0, 9)).toEqual([
      '<item>',
      '<title>Angular &amp; signaux &lt;v22&gt;</title>',
      `<link>${SITE}/blog/angular-signaux</link>`,
      `<guid isPermaLink="true">${SITE}/blog/angular-signaux</guid>`,
      '<pubDate>Thu, 01 Oct 2026 08:00:00 GMT</pubDate>',
      '<dc:creator>Julien Nédellec</dc:creator>',
      '<category>Angular</category>',
      '<category>SSR &amp; SEO</category>',
      '<description>L&apos;essentiel</description>',
    ]);
  });

  it('Given an article with a cover When the feed is built Then its item carries the cover as an enclosure', () => {
    const [item] = itemsOf(buildRss([anItem({ enclosure: COVER })], BUILT_AT));

    expect(linesOf(item ?? '')).toContain(
      `<enclosure url="${COVER.url}" length="48213" type="image/jpeg" />`,
    );
  });

  it('Given an article without a cover When the feed is built Then its item has no enclosure', () => {
    const xml = buildRss([anItem({ enclosure: null })], BUILT_AT);

    expect({ items: count(xml, '<item>'), enclosures: count(xml, '<enclosure') }).toEqual({
      items: 1,
      enclosures: 0,
    });
  });

  it('Given an article body with script and a site image When the feed is built Then the full text is sanitized and the image points to the site', () => {
    const xml = buildRss(
      [
        anItem({
          post: makeBlogPost({
            contentMarkdown:
              'Texte **gras**\n\n<script>alert(1)</script>\n\n![Schéma](/api/storage/schema.avif)',
          }),
        }),
      ],
      BUILT_AT,
    );
    const content = encodedContentOf(xml) ?? '';

    expect({
      paragraph: content.includes('<p>Texte <strong>gras</strong></p>'),
      image: content.includes(`src="${SITE}/api/storage/schema.avif"`),
      script: content.includes('<script'),
    }).toEqual({ paragraph: true, image: true, script: false });
  });

  it('Given two articles When the feed is built Then they keep the order of the API', () => {
    const xml = buildRss(
      [
        anItem({ post: makeBlogPost({ slug: 'plus-recent' }) }),
        anItem({ post: makeBlogPost({ slug: 'plus-ancien' }) }),
      ],
      BUILT_AT,
    );

    expect(itemsOf(xml).map((item) => /<link>([^<]*)<\/link>/.exec(item)?.[1])).toEqual([
      `${SITE}/blog/plus-recent`,
      `${SITE}/blog/plus-ancien`,
    ]);
  });
});

describe('escapeCdata', () => {
  it.each([
    ['<p>a]]>b</p>', '<p>a]]]]><![CDATA[>b</p>'],
    ['x]]>y]]>z', 'x]]]]><![CDATA[>y]]]]><![CDATA[>z'],
    ['<p>sans fin de section</p>', '<p>sans fin de section</p>'],
  ])(
    'Given %s When it goes into a CDATA section Then every section end is split',
    (html, escaped) => {
      expect(escapeCdata(html)).toBe(escaped);
    },
  );
});
