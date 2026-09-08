import { RenderMode, type ServerRoute } from '@angular/ssr';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPrerenderSlugs, serverRoutes } from './app.routes.server';

const findRoute = (path: string): ServerRoute | undefined =>
  serverRoutes.find((route) => route.path === path);

describe('serverRoutes', () => {
  it.each(['blog/:slug', 'projects/:slug'])(
    'prerenders %s with slugs discovered at build time',
    (path) => {
      const route = findRoute(path);
      expect(route?.renderMode).toBe(RenderMode.Prerender);
      expect(route).toHaveProperty('getPrerenderParams');
    },
  );
});

describe('fetchPrerenderSlugs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the API rows to route params', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async (): Promise<{ slug: string }[]> => [
          { slug: 'dashflow' },
          { slug: 'candidash' },
        ],
      }),
    );

    const params = await fetchPrerenderSlugs('/projects?_sort=order&limit=100');

    expect(params).toEqual([{ slug: 'dashflow' }, { slug: 'candidash' }]);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.nedellec-julien.fr/api/projects?_sort=order&limit=100',
    );
  });

  // Un site publié sans ses pages projet est pire qu'un build qui échoue : Dokploy garde alors
  // l'image précédente en ligne. Le 429 (limite de débit) est réessayé, le reste fait échouer.
  it('retries a 429 after the delay the API announces, then succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '2' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async (): Promise<{ slug: string }[]> => [{ slug: 'dashflow' }],
      });
    vi.stubGlobal('fetch', fetchMock);

    const pending = fetchPrerenderSlugs('/projects');
    await vi.advanceTimersByTimeAsync(2000);

    await expect(pending).resolves.toEqual([{ slug: 'dashflow' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('gives up after three 429 in a row and fails the build', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, headers: new Headers() }),
    );

    const pending = fetchPrerenderSlugs('/projects').catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(60_000);

    await expect(pending).resolves.toMatch(/429/);
    expect(fetch).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it.each([
    ['a non-2xx response', { ok: false, status: 503, headers: new Headers() }],
    ['a network failure', undefined],
  ])('fails the build on %s instead of publishing an amputated site', async (_label, response) => {
    vi.stubGlobal(
      'fetch',
      response
        ? vi.fn().mockResolvedValue(response)
        : vi.fn().mockRejectedValue(new Error('ENOTFOUND')),
    );

    await expect(fetchPrerenderSlugs('/blog/posts')).rejects.toThrow(/blog\/posts/);
  });
});
