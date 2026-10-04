import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OfferPage } from './application/offer-page';
import { OFFERS } from './domain/offer-catalog.static-data';
import { OFFER_PAGES } from './domain/offer-pages.static-data';
import { OFFER_ROUTES } from './offer.routes';
import { toOfferSeo } from './offer-seo';

const routeOf = (slug: string): Route | undefined =>
  OFFER_ROUTES.find((route) => route.path === slug);

describe('OFFER_ROUTES', () => {
  it('declares one static route per offer, in catalogue order', () => {
    expect(OFFER_ROUTES.map((route) => route.path)).toEqual(OFFERS.map(({ slug }) => slug));
  });

  describe.each(OFFERS.map((summary) => [summary.slug, summary] as const))(
    'offer %s',
    (slug, summary) => {
      it('lazy loads the generic offer page', async () => {
        const route = routeOf(slug);
        expect(route?.component).toBeUndefined();
        expect(await route?.loadComponent?.()).toBe(OfferPage);
      });

      it('binds its summary and page content, and nothing else', () => {
        const data = routeOf(slug)?.data;
        expect(Object.keys(data ?? {}).sort()).toEqual(['content', 'seo', 'summary']);
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
