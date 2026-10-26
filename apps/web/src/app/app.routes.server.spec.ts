import { RenderMode, type ServerRoute } from '@angular/ssr';
import { describe, expect, it } from 'vitest';
import { serverRoutes } from './app.routes.server';

const CONTENT_ROUTES = ['', 'about', 'projects', 'projects/:slug', 'blog', 'blog/:slug'];

const findRoute = (path: string): ServerRoute | undefined =>
  serverRoutes.find((route) => route.path === path);

describe('serverRoutes', () => {
  it.each(CONTENT_ROUTES)('renders the content route "%s" on each request', (path) => {
    expect(findRoute(path)?.renderMode).toBe(RenderMode.Server);
  });

  it('renders the insert guide on each request, so that the served HTML shows the requested choice', () => {
    expect(findRoute('atelier/plaquettes')?.renderMode).toBe(RenderMode.Server);
  });

  // nginx ne relaie à Node qu'une liste fermée de chemins : toute autre route serveur répondrait 404.
  it('renders on request exactly the routes nginx relays to Node', () => {
    const serverRendered = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Server)
      .map((route) => route.path);

    expect([...serverRendered].sort()).toEqual([...CONTENT_ROUTES, 'atelier/plaquettes'].sort());
  });

  it.each(['mentions-legales', 'confidentialite', 'atelier'])(
    'prerenders the static page %s',
    (path) => {
      expect(findRoute(path)?.renderMode).toBe(RenderMode.Prerender);
    },
  );

  // Offres retirées (spec 029) : nginx répond 410, rien ne doit plus être prérendu sous /offres.
  it('prerenders nothing under the retired offers and booking pages', () => {
    expect(
      serverRoutes.filter(({ path }) => path.startsWith('offre') || path.startsWith('rendez-vous')),
    ).toEqual([]);
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
});
