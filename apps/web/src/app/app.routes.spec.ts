import type { Route } from '@angular/router';
import { OfferPage } from '@features/offer/application/offer-page';
import { OFFER_PAGES } from '@features/offer/domain/offer-pages.static-data';
import { toOfferSeo } from '@features/offer/offer-seo';
import { offerSummaryOf } from '@features/offer/testing/offer-builders';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

const OFFER_TITLE = 'Site pro pour ateliers de mécanique | Julien Nédellec';
const OFFER_URL = `${SITE_IDENTITY.siteUrl}/offre-site-industrie`;

const findRoute = (path: string): Route | undefined => routes.find((route) => route.path === path);

const offerRoute = (): Route | undefined => findRoute('offre-site-industrie');

describe('routes', () => {
  it('lazy loads the generic offer page on /offre-site-industrie', async () => {
    const route = offerRoute();
    expect(route?.component).toBeUndefined();
    expect(await route?.loadComponent?.()).toBe(OfferPage);
  });

  describe('workshop offer', () => {
    it('binds the workshop summary, its page content and its SEO, without menu preloading', () => {
      const data = offerRoute()?.data;
      expect(Object.keys(data ?? {}).sort()).toEqual(['content', 'seo', 'summary']);
      expect(data?.['summary']).toBe(offerSummaryOf('site-atelier'));
      expect(data?.['content']).toBe(OFFER_PAGES['site-atelier']);
    });

    it('titles the page and builds its SEO for the current url', () => {
      expect(offerRoute()?.title).toBe(OFFER_TITLE);
      expect(offerRoute()?.data?.['seo']).toEqual(
        toOfferSeo(offerSummaryOf('site-atelier'), OFFER_PAGES['site-atelier'], OFFER_URL),
      );
    });
  });
});
