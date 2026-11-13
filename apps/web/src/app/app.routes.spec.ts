import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { routes } from './app.routes';

const leafOf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leafOf(snapshot.firstChild) : snapshot;

async function navigate(url: string): Promise<{ url: string; leaf: ActivatedRouteSnapshot }> {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  return { url: router.url, leaf: leafOf(router.routerState.snapshot.root) };
}

describe('routes', () => {
  // Offres retirées (spec 029) : nginx répond 410 ; côté client, aucune route ne les sert plus.
  describe('retired offer urls', () => {
    it.each([
      '/offres',
      '/offres/site-vitrine',
      '/offres/application-metier',
      '/offre-site-industrie',
    ])(
      'Given %s When navigated to Then no route matches it but the not-found page, and no redirect happens',
      async (path) => {
        const { url, leaf } = await navigate(path);

        expect([url, leaf.routeConfig?.path]).toEqual([path, '**']);
      },
    );

    it('declares no route under /offres nor the former workshop url', () => {
      expect(
        routes.filter(({ path }) => path?.startsWith('offre')).map(({ path }) => path),
      ).toEqual([]);
    });
  });
});
