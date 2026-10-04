import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type Route, Router, provideRouter } from '@angular/router';
import { OFFER_ROUTES } from '@features/offer/offer.routes';
import { offerSummaryOf } from '@features/offer/testing/offer-builders';
import { routes } from './app.routes';

const findRoute = (path: string): Route | undefined => routes.find((route) => route.path === path);

const leafOf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leafOf(snapshot.firstChild) : snapshot;

async function navigate(url: string): Promise<{ url: string; leaf: ActivatedRouteSnapshot }> {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  return { url: router.url, leaf: leafOf(router.routerState.snapshot.root) };
}

describe('routes', () => {
  describe('offer catalogue', () => {
    it('lazy loads the offer routes under /offres', async () => {
      const route = findRoute('offres');
      expect(route?.component).toBeUndefined();
      expect(route?.children).toBeUndefined();
      expect(await route?.loadChildren?.()).toBe(OFFER_ROUTES);
    });

    it('serves the workshop offer at /offres/site-atelier', async () => {
      const { url, leaf } = await navigate('/offres/site-atelier');
      expect(url).toBe('/offres/site-atelier');
      expect(leaf.data['summary']).toBe(offerSummaryOf('site-atelier'));
    });
  });

  describe('legacy workshop offer url', () => {
    it('redirects to the catalogue url instead of rendering a page', () => {
      const route = findRoute('offre-site-industrie');
      expect(route?.redirectTo).toBe('/offres/site-atelier');
      expect(route?.loadComponent).toBeUndefined();
    });

    it('lands on the workshop offer when navigated to', async () => {
      const { url, leaf } = await navigate('/offre-site-industrie');
      expect(url).toBe('/offres/site-atelier');
      expect(leaf.data['summary']).toBe(offerSummaryOf('site-atelier'));
    });
  });
});
