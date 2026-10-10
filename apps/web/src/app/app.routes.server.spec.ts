import { RenderMode, type ServerRoute } from '@angular/ssr';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { describe, expect, it } from 'vitest';
import { serverRoutes } from './app.routes.server';

const CONTENT_ROUTES = ['', 'about', 'projects', 'projects/:slug', 'blog', 'blog/:slug'];

const findRoute = (path: string): ServerRoute | undefined =>
  serverRoutes.find((route) => route.path === path);

describe('serverRoutes', () => {
  it.each(CONTENT_ROUTES)('renders the content route "%s" on each request', (path) => {
    expect(findRoute(path)?.renderMode).toBe(RenderMode.Server);
  });

  // nginx ne relaie à Node qu'une liste fermée de chemins : toute autre route serveur répondrait 404.
  it('renders on request exactly the content routes and nothing else', () => {
    const serverRendered = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Server)
      .map((route) => route.path);

    expect([...serverRendered].sort()).toEqual([...CONTENT_ROUTES].sort());
  });

  it.each(['mentions-legales', 'confidentialite', 'offres'])(
    'prerenders the static page %s',
    (path) => {
      expect(findRoute(path)?.renderMode).toBe(RenderMode.Prerender);
    },
  );

  it.each(OFFERS.map(({ slug }) => slug))('prerenders the offer page offres/%s', (slug) => {
    expect(findRoute(`offres/${slug}`)?.renderMode).toBe(RenderMode.Prerender);
  });

  it.each(['login', 'two-factor', 'admin/**', '**'])('renders %s in the browser only', (path) => {
    expect(findRoute(path)?.renderMode).toBe(RenderMode.Client);
  });

  it('never asks the API for route params at build time', () => {
    const withPrerenderParams = serverRoutes
      .filter((route) => 'getPrerenderParams' in route)
      .map((route) => route.path);

    expect(withPrerenderParams).toEqual([]);
  });

  // Un redirect prérendu ne donne qu'une page meta refresh, pas un 301 : nginx s'en charge.
  it('leaves the legacy offer url to the client fallback instead of prerendering it', () => {
    expect(findRoute('offre-site-industrie')).toBeUndefined();
  });
});
