import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { parseMarkdown } from '@features/blog/infra/parse-markdown';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { escapeXml } from './xml-escape';

export type RssPost = Pick<
  BlogPost,
  'slug' | 'title' | 'excerpt' | 'contentMarkdown' | 'tags' | 'publishedAt'
>;

export type RssEnclosure = {
  readonly url: string;
  readonly type: string;
  readonly length: string;
};

export type RssItem = {
  readonly post: RssPost;
  readonly enclosure: RssEnclosure | null;
};

const AUTHOR = 'Julien Nédellec';
const SITE_URL = SITE_IDENTITY.siteUrl;

// Un `]]>` dans le HTML fermerait la section CDATA : elle est scindée autour.
export function escapeCdata(html: string): string {
  return html.replaceAll(']]>', ']]]]><![CDATA[>');
}

function toItem({ post, enclosure }: RssItem): string {
  const link = `${SITE_URL}/blog/${escapeXml(post.slug)}`;
  const content = parseMarkdown(post.contentMarkdown, { imageOrigin: SITE_URL });
  return [
    '    <item>',
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    ...(post.publishedAt
      ? [`      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`]
      : []),
    `      <dc:creator>${escapeXml(AUTHOR)}</dc:creator>`,
    ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
    `      <description>${escapeXml(post.excerpt)}</description>`,
    `      <content:encoded><![CDATA[${escapeCdata(content)}]]></content:encoded>`,
    ...(enclosure
      ? [
          `      <enclosure url="${escapeXml(enclosure.url)}" length="${escapeXml(enclosure.length)}" type="${escapeXml(enclosure.type)}" />`,
        ]
      : []),
    '    </item>',
  ].join('\n');
}

export function buildRss(items: readonly RssItem[], builtAt: Date): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${AUTHOR} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Retours d'expérience Angular, NestJS, PostgreSQL et self-hosting.</description>
    <language>fr</language>
    <lastBuildDate>${builtAt.toUTCString()}</lastBuildDate>
${items.map(toItem).join('\n')}
  </channel>
</rss>
`;
}
