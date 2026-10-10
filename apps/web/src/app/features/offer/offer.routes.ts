import type { Routes } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OFFERS } from './domain/offer-catalog.static-data';
import { REQUEST_ANCHOR_DATA_KEY } from '@core/navigation/section-scroller';
import { OFFER_REQUEST_FRAGMENT, offerPath } from './domain/offer-path';
import { OFFER_PAGES } from './domain/offer-pages.static-data';
import { toOfferCatalogueSeo, toOfferSeo } from './offer-seo';

const catalogueSeo = toOfferCatalogueSeo(OFFERS);

export const OFFER_ROUTES: Routes = [
  {
    path: '',
    title: catalogueSeo.title,
    loadComponent: () =>
      import('./pages/offer-catalogue/offer-catalogue').then((m) => m.OfferCatalogue),
    data: { seo: catalogueSeo },
  },
  ...OFFERS.map((summary) => {
    const content = OFFER_PAGES[summary.slug];
    return {
      path: summary.slug,
      title: summary.seo.title,
      loadComponent: () => import('./pages/offer-page/offer-page').then((m) => m.OfferPage),
      data: {
        summary,
        content,
        [REQUEST_ANCHOR_DATA_KEY]: OFFER_REQUEST_FRAGMENT,
        seo: toOfferSeo(summary, content, `${SITE_IDENTITY.siteUrl}${offerPath(summary.slug)}`),
      },
    };
  }),
];
