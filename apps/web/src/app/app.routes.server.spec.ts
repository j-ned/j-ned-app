import { RenderMode, type ServerRoute } from '@angular/ssr';
import { describe, expect, it } from 'vitest';
import { serverRoutes } from './app.routes.server';

const CONTENT_ROUTES = ['', 'about', 'projects', 'projects/:slug', 'blog', 'blog/:slug'];

const findRoute = (path: string): ServerRoute | undefined =>
  serverRoutes.find((route) => route.path === path);

describe('serverRoutes', () => {
  // La table de routes Vercel (`scripts/build-vercel.mjs`) ne réveille la fonction de rendu que pour une
  // liste fermée de chemins : toute autre route serveur répondrait 404.
  it('renders on request exactly the routes Vercel sends to the render function', () => {
    const serverRendered = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Server)
      .map((route) => route.path);

    expect([...serverRendered].sort()).toEqual(
      [...CONTENT_ROUTES, 'atelier', 'atelier/plaquettes', 'atelier/decodeur'].sort(),
    );
  });

  it.each(['mentions-legales', 'confidentialite'])('prerenders the static page %s', (path) => {
    expect(findRoute(path)?.renderMode).toBe(RenderMode.Prerender);
  });

  // Offres retirées (spec 029) : Vercel répond 410, rien ne doit plus être prérendu sous /offres.
  it('prerenders nothing under the retired offers and booking pages', () => {
    expect(
      serverRoutes.filter(({ path }) => path.startsWith('offre') || path.startsWith('rendez-vous')),
    ).toEqual([]);
  });

  it.each(['login', 'two-factor', 'admin/**', '**'])('renders %s in the browser only', (path) => {
    expect(findRoute(path)?.renderMode).toBe(RenderMode.Client);
  });
});
