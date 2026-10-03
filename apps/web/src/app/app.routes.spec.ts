import type { Route } from '@angular/router';
import { SiteOffer } from '@features/offer/application/site-offer';
import { SITE_OFFER_PRICES } from '@features/offer/domain/site-offer.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

type JsonLdNode = Readonly<Record<string, unknown>>;

const OFFER_TITLE = 'Site pro pour ateliers de mécanique | Julien Nédellec';
const OFFER_URL = `${SITE_IDENTITY.siteUrl}/offre-site-industrie`;

const findRoute = (path: string): Route | undefined => routes.find((route) => route.path === path);

const offerRoute = (): Route | undefined => findRoute('offre-site-industrie');

const offerSeo = (): Readonly<Record<string, unknown>> | undefined => offerRoute()?.data?.['seo'];

const offerGraph = (): readonly JsonLdNode[] => {
  const structuredData = offerSeo()?.['structuredData'] as JsonLdNode | undefined;
  return (structuredData?.['@graph'] as readonly JsonLdNode[] | undefined) ?? [];
};

const graphNode = (type: string): JsonLdNode | undefined =>
  offerGraph().find((node) => node['@type'] === type);

describe('routes', () => {
  it('lazy loads the site offer page on /offre-site-industrie', async () => {
    const route = findRoute('offre-site-industrie');
    expect(route?.component).toBeUndefined();
    expect(await route?.loadComponent?.()).toBe(SiteOffer);
  });

  describe('site offer SEO', () => {
    it('carries only SEO data, without menu preloading', () => {
      expect(Object.keys(offerRoute()?.data ?? {})).toEqual(['seo']);
    });

    it('describes the offer page with its own title, canonical url and website type', () => {
      const seo = offerSeo();
      expect(offerRoute()?.title).toBe(OFFER_TITLE);
      expect(seo?.['title']).toBe(OFFER_TITLE);
      expect(seo?.['url']).toBe(OFFER_URL);
      expect(seo?.['type']).toBe('website');
    });

    it('gives a search snippet of at most 160 characters without em-dash', () => {
      const description = offerSeo()?.['description'];
      expect(typeof description).toBe('string');
      expect((description as string).length).toBeGreaterThan(0);
      expect((description as string).length).toBeLessThanOrEqual(160);
      expect(description).not.toContain('—');
    });

    it('groups a Service and a BreadcrumbList in a single schema.org graph', () => {
      const structuredData = offerSeo()?.['structuredData'] as JsonLdNode | undefined;
      expect(structuredData?.['@context']).toBe('https://schema.org');
      expect(
        offerGraph()
          .map((node) => node['@type'] as string)
          .sort(),
      ).toEqual(['BreadcrumbList', 'Service']);
    });

    it('identifies the service as a showcase site creation provided by Julien Nédellec', () => {
      const service = graphNode('Service');
      expect(service?.['serviceType']).toBe('Création de site vitrine');
      expect(service?.['url']).toBe(OFFER_URL);
      expect(service?.['provider']).toEqual({
        '@type': 'Person',
        name: 'Julien Nédellec',
        url: SITE_IDENTITY.siteUrl,
      });
    });

    it('serves Yvelines and Île-de-France', () => {
      expect(graphNode('Service')?.['areaServed']).toEqual([
        { '@type': 'AdministrativeArea', name: 'Yvelines' },
        { '@type': 'AdministrativeArea', name: 'Île-de-France' },
      ]);
    });

    it('prices the creation and the monthly maintenance from the offer price source', () => {
      expect(graphNode('Service')?.['offers']).toEqual([
        {
          '@type': 'Offer',
          name: 'Création',
          price: String(SITE_OFFER_PRICES.creationEur),
          priceCurrency: 'EUR',
        },
        {
          '@type': 'Offer',
          name: 'Maintenance',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: String(SITE_OFFER_PRICES.maintenanceMonthlyEur),
            priceCurrency: 'EUR',
            unitCode: 'MON',
          },
        },
      ]);
    });

    it('places the offer page under the home page in the breadcrumb', () => {
      expect(graphNode('BreadcrumbList')?.['itemListElement']).toEqual([
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Sites pour ateliers', item: OFFER_URL },
      ]);
    });
  });
});
