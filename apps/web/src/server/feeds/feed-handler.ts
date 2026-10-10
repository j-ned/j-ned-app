import { toShareImageUrl } from '@shared/seo/share-image';
import { buildRss, type RssEnclosure, type RssPost } from './rss';
import { buildSitemap, type SitemapPost } from './sitemap';

export type FeedTarget = 'sitemap' | 'rss';

type FeedHandlerOptions = {
  readonly apiBaseUrl: string;
  readonly fetch: typeof fetch;
  readonly startedAt: Date;
};

export type FeedHandler = (
  target: FeedTarget,
  visitorForwardedFor?: string | null,
) => Promise<Response>;

type FeedPost = SitemapPost & RssPost & { readonly coverImage: string };

const API_TIMEOUT_MS = 5_000;

const CONTENT_TYPES: Readonly<Record<FeedTarget, string>> = {
  sitemap: 'application/xml; charset=utf-8',
  rss: 'application/rss+xml; charset=utf-8',
};

export function createFeedHandler({
  apiBaseUrl,
  fetch,
  startedAt,
}: FeedHandlerOptions): FeedHandler {
  // Clés de stockage empreintées (`<id>-<sha8>`) : une couverture mesurée ne change plus.
  const enclosures = new Map<string, RssEnclosure>();

  // `setTimeout` + `AbortController` plutôt qu'`AbortSignal.timeout` : un délai simulable en test.
  // L'adresse du visiteur garde chaque lecture dans son propre quota de l'API.
  async function request(
    url: string,
    visitor: string | null,
    method: 'GET' | 'HEAD' = 'GET',
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const headers: Record<string, string> = visitor ? { 'X-Forwarded-For': visitor } : {};
    try {
      return await fetch(url, { method, headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson<T>(path: string, visitor: string | null): Promise<T> {
    const response = await request(`${apiBaseUrl}${path}`, visitor);
    if (!response.ok) throw new Error(`${path} answered ${response.status}`);
    return (await response.json()) as T;
  }

  // RSS 2.0 exige `length` et `type` : un HEAD sur l'API les donne sans télécharger. Un échec omet
  // l'enclosure (l'article reste dans le flux) et sera retenté au rendu suivant.
  async function enclosureOf(
    coverImage: string,
    visitor: string | null,
  ): Promise<RssEnclosure | null> {
    if (!coverImage) return null;
    const isAbsolute = coverImage.startsWith('http');
    const url = toShareImageUrl(isAbsolute ? coverImage : `/api${coverImage}`);
    const known = enclosures.get(url);
    if (known) return known;
    try {
      const probe = await request(
        isAbsolute ? url : toShareImageUrl(`${apiBaseUrl}${coverImage}`),
        visitor,
        'HEAD',
      );
      const type = probe.headers.get('Content-Type');
      const length = probe.headers.get('Content-Length');
      if (!probe.ok || !type || !length) return null;
      const enclosure = { url, type, length };
      enclosures.set(url, enclosure);
      return enclosure;
    } catch {
      return null;
    }
  }

  async function render(target: FeedTarget, visitor: string | null): Promise<string> {
    if (target === 'sitemap') {
      const [projects, posts] = await Promise.all([
        readJson<readonly { readonly slug: string }[]>('/projects?_sort=order&limit=100', visitor),
        readJson<readonly FeedPost[]>('/blog/posts', visitor),
      ]);
      return buildSitemap({
        projectSlugs: projects.map(({ slug }) => slug),
        posts,
        staticLastmod: startedAt,
      });
    }
    const posts = await readJson<readonly FeedPost[]>('/blog/posts', visitor);
    const items = await Promise.all(
      posts.map(async (post) => ({ post, enclosure: await enclosureOf(post.coverImage, visitor) })),
    );
    return buildRss(items, new Date());
  }

  return async (target, visitorForwardedFor = null) => {
    try {
      const body = await render(target, visitorForwardedFor);
      return new Response(body, {
        headers: { 'Content-Type': CONTENT_TYPES[target], 'Cache-Control': 'no-cache' },
      });
    } catch (error) {
      // 503 : nginx sert alors la dernière copie du flux plutôt qu'un flux vide.
      console.error('Feed unavailable:', error);
      return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
