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

  it.each([
    ['a non-2xx response', { ok: false, json: async (): Promise<never[]> => [] }],
    ['a network failure', undefined],
  ])('returns no params on %s so the build still succeeds', async (_label, response) => {
    vi.stubGlobal(
      'fetch',
      response
        ? vi.fn().mockResolvedValue(response)
        : vi.fn().mockRejectedValue(new Error('ENOTFOUND')),
    );

    await expect(fetchPrerenderSlugs('/blog/posts')).resolves.toEqual([]);
  });
});
