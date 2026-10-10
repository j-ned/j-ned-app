import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OfferCatalogue } from './pages/offer-catalogue/offer-catalogue';
import { OfferPage } from './pages/offer-page/offer-page';
import { OFFERS } from './domain/offer-catalog.static-data';
import { OFFER_PAGES } from './domain/offer-pages.static-data';
import { OFFER_REQUEST_FRAGMENT } from './domain/offer-path';
import { REQUEST_ANCHOR_DATA_KEY } from '@core/navigation/section-scroller';
import { OFFER_ROUTES } from './offer.routes';
import { toOfferCatalogueSeo, toOfferSeo } from './offer-seo';

const routeOf = (slug: string): Route | undefined =>
  OFFER_ROUTES.find((route) => route.path === slug);

describe('OFFER_ROUTES', () => {
  it('declares the catalogue, then one static route per offer, in catalogue order', () => {
    expect(OFFER_ROUTES.map((route) => route.path)).toEqual([
      '',
      ...OFFERS.map(({ slug }) => slug),
    ]);
  });

  describe('catalogue', () => {
    it('lazy loads the catalogue page', async () => {
      const route = routeOf('');
      expect(route?.component).toBeUndefined();
      expect(await route?.loadComponent?.()).toBe(OfferCatalogue);
    });

    it('titles the page and builds its SEO from the whole catalogue, and binds nothing else', () => {
      const route = routeOf('');
      const seo = toOfferCatalogueSeo(OFFERS);
      expect(Object.keys(route?.data ?? {})).toEqual(['seo']);
      expect(route?.data?.['seo']).toEqual(seo);
      expect(route?.title).toBe(seo.title);
    });
  });

  describe.each(OFFERS.map((summary) => [summary.slug, summary] as const))(
    'offer %s',
    (slug, summary) => {
      it('lazy loads the generic offer page', async () => {
        const route = routeOf(slug);
        expect(route?.component).toBeUndefined();
        expect(await route?.loadComponent?.()).toBe(OfferPage);
      });

      it('binds its summary, its page content and its request anchor, and nothing else', () => {
        const data = routeOf(slug)?.data;
        expect(Object.keys(data ?? {}).sort()).toEqual([
          'content',
          REQUEST_ANCHOR_DATA_KEY,
          'seo',
          'summary',
        ]);
        expect(data?.[REQUEST_ANCHOR_DATA_KEY]).toBe(OFFER_REQUEST_FRAGMENT);
        expect(data?.['summary']).toBe(summary);
        expect(data?.['content']).toBe(OFFER_PAGES[slug]);
      });

      it('titles the page and builds its SEO for its catalogue url', () => {
        const url = `${SITE_IDENTITY.siteUrl}/offres/${slug}`;
        const route = routeOf(slug);
        expect(route?.title).toBe(summary.seo.title);
        expect(route?.data?.['seo']).toEqual(toOfferSeo(summary, OFFER_PAGES[slug], url));
        expect(route?.data?.['seo']?.url).toBe(url);
      });
    },
  );
});
