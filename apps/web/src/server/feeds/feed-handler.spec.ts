import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { createFeedHandler, type FeedHandler, type FeedTarget } from './feed-handler';

const API = 'http://api:3000/api';
const SITE = 'https://nedellec-julien.fr';
const PROJECTS_URL = `${API}/projects?_sort=order&limit=100`;
const POSTS_URL = `${API}/blog/posts`;
const COVER_PATH = '/storage/portfolio-storage/blog/c-1a2b3c4d.avif';
const COVER_PROBE_URL = `${API}${COVER_PATH}?variant=share`;
const COVER_ENCLOSURE = `<enclosure url="${SITE}/api${COVER_PATH}?variant=share" length="48213" type="image/jpeg" />`;

type Route = (init: RequestInit | undefined) => Promise<Response>;

const json = (body: unknown): Promise<Response> =>
  Promise.resolve(
    new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }),
  );

const HEALTHY_ROUTES: Readonly<Record<string, Route>> = {
  [PROJECTS_URL]: () => json([{ slug: 'dashflow' }]),
  [POSTS_URL]: () => json([makeBlogPost({ slug: 'article-temoin', coverImage: COVER_PATH })]),
  [COVER_PROBE_URL]: () =>
    Promise.resolve(
      new Response(null, { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '48213' } }),
    ),
};

function anApi(
  overrides: Readonly<Record<string, Route>> = {},
): ReturnType<typeof vi.fn<typeof fetch>> {
  const routes = { ...HEALTHY_ROUTES, ...overrides };
  return vi.fn<typeof fetch>((input, init) => {
    const route = routes[String(input)];
    return route ? route(init) : Promise.resolve(new Response(null, { status: 404 }));
  });
}

function aHandler(api: typeof fetch): FeedHandler {
  return createFeedHandler({
    apiBaseUrl: API,
    fetch: api,
    startedAt: new Date('2026-10-10T06:30:00Z'),
  });
}

type Served = {
  readonly status: number;
  readonly type: string | null;
  readonly cache: string | null;
  readonly body: string;
};

async function serve(handler: FeedHandler, target: FeedTarget): Promise<Served> {
  const response = await handler(target);
  return {
    status: response.status,
    type: response.headers.get('Content-Type'),
    cache: response.headers.get('Cache-Control'),
    body: await response.text(),
  };
}

const headCallsTo = (api: ReturnType<typeof vi.fn<typeof fetch>>, url: string): number =>
  api.mock.calls.filter(([input, init]) => String(input) === url && init?.method === 'HEAD').length;

describe('createFeedHandler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given a healthy API When the sitemap is requested Then it is served fresh as XML with the projects and articles read from the internal API', async () => {
    const served = await serve(aHandler(anApi()), 'sitemap');

    expect({
      status: served.status,
      type: served.type,
      cache: served.cache,
      project: served.body.includes(`<loc>${SITE}/projects/dashflow</loc>`),
      article: served.body.includes(`<loc>${SITE}/blog/article-temoin</loc>`),
    }).toEqual({
      status: 200,
      type: 'application/xml; charset=utf-8',
      cache: 'no-cache',
      project: true,
      article: true,
    });
  });

  it('Given a healthy API When the feed is requested Then it is served fresh as RSS with the cover measured on the internal API', async () => {
    const api = anApi();

    const served = await serve(aHandler(api), 'rss');

    expect({
      status: served.status,
      type: served.type,
      cache: served.cache,
      enclosure: served.body.includes(COVER_ENCLOSURE),
      probes: headCallsTo(api, COVER_PROBE_URL),
    }).toEqual({
      status: 200,
      type: 'application/rss+xml; charset=utf-8',
      cache: 'no-cache',
      enclosure: true,
      probes: 1,
    });
  });

  it('Given the feed was already served When it is requested again Then the cover is not measured a second time', async () => {
    const api = anApi();
    const handler = aHandler(api);

    const first = await serve(handler, 'rss');
    const second = await serve(handler, 'rss');

    expect({
      enclosures: [first.body.includes(COVER_ENCLOSURE), second.body.includes(COVER_ENCLOSURE)],
      probes: headCallsTo(api, COVER_PROBE_URL),
    }).toEqual({ enclosures: [true, true], probes: 1 });
  });

  it.each<[FeedTarget, string | null]>([
    ['sitemap', '198.51.100.9'],
    ['rss', '198.51.100.9'],
    ['rss', null],
  ])(
    'Given a %s request for the visitor %s When the API is read Then every read carries that visitor address',
    async (target, visitor) => {
      const api = anApi();

      await aHandler(api)(target, visitor);

      const forwarded = api.mock.calls.map(([, init]) =>
        new Headers(init?.headers).get('X-Forwarded-For'),
      );
      expect(forwarded.length > 0 && forwarded.every((value) => value === visitor)).toBe(true);
    },
  );

  const unreachable: Route = () => Promise.reject(new TypeError('fetch failed'));
  const answering =
    (status: number): Route =>
    () =>
      Promise.resolve(new Response(null, { status }));

  it.each<[string, FeedTarget, string, Route]>([
    ['unreachable', 'sitemap', PROJECTS_URL, unreachable],
    ['in error', 'sitemap', POSTS_URL, answering(500)],
    ['throttling', 'sitemap', PROJECTS_URL, answering(429)],
    ['unreachable', 'rss', POSTS_URL, unreachable],
    ['in error', 'rss', POSTS_URL, answering(502)],
    ['throttling', 'rss', POSTS_URL, answering(429)],
  ])(
    'Given the API is %s When the %s is requested Then it answers 503 so that nginx serves its last copy',
    async (_label, target, failingUrl, failure) => {
      const served = await serve(aHandler(anApi({ [failingUrl]: failure })), target);

      expect(served.status).toBe(503);
    },
  );

  it.each<FeedTarget>(['sitemap', 'rss'])(
    'Given the API never answers When the %s is requested Then it answers 503 after five seconds, not before',
    async (target) => {
      vi.useFakeTimers();
      const hanging: Route = (init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        });
      const pending = aHandler(anApi({ [POSTS_URL]: hanging }))(target);
      let settled: number | null = null;
      void pending.then((response) => (settled = response.status));

      await vi.advanceTimersByTimeAsync(4_999);
      const beforeTimeout = settled;
      await vi.advanceTimersByTimeAsync(1);

      expect({ beforeTimeout, afterTimeout: settled }).toEqual({
        beforeTimeout: null,
        afterTimeout: 503,
      });
    },
  );
});
