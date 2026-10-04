import type { Routes } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OFFERS } from './domain/offer-catalog.static-data';
import { offerPath } from './domain/offer-path';
import { OFFER_PAGES } from './domain/offer-pages.static-data';
import { toOfferSeo } from './offer-seo';

export const OFFER_ROUTES: Routes = OFFERS.map((summary) => {
  const content = OFFER_PAGES[summary.slug];
  return {
    path: summary.slug,
    title: summary.seo.title,
    loadComponent: () => import('./application/offer-page').then((m) => m.OfferPage),
    data: {
      summary,
      content,
      seo: toOfferSeo(summary, content, `${SITE_IDENTITY.siteUrl}${offerPath(summary.slug)}`),
    },
  };
});
