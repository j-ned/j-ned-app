import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { SeoData } from '@shared/seo/seo';
import { formatEur } from './domain/format-eur';
import { OFFERS } from './domain/offer-catalog.static-data';
import { offerPath } from './domain/offer-path';
import { OFFER_PAGES } from './domain/offer-pages.static-data';
import { OFFER_PRICES } from './domain/offer-prices.static-data';
import type { OfferSlug } from './domain/models/offer.model';
import { toOfferCatalogJsonLd, toOfferCatalogueSeo, toOfferSeo } from './offer-seo';
import {
  makeOfferPageContent,
  makeOfferPriceLine,
  makeOfferSummary,
  offerSummaryOf,
} from './testing/offer-builders';

type JsonLdNode = Readonly<Record<string, unknown>>;

const CATALOGUE_URL = `${SITE_IDENTITY.siteUrl}/offres`;
const OFFER_URL = `${SITE_IDENTITY.siteUrl}/offres/site-atelier`;

const graphOf = (structuredData: Record<string, unknown> | undefined): readonly JsonLdNode[] =>
  (structuredData?.['@graph'] as readonly JsonLdNode[] | undefined) ?? [];

describe('toOfferSeo', () => {
  it('describes the workshop offer with the same title, snippet and schema.org graph as before', () => {
    const prices = OFFER_PRICES['site-atelier'];

    const seo = toOfferSeo(offerSummaryOf('site-atelier'), OFFER_PAGES['site-atelier'], OFFER_URL);

    expect(seo).toEqual({
      title: 'Site pro pour ateliers de mécanique | Julien Nédellec',
      description: `Site vitrine pour ateliers d'usinage et de décolletage des Yvelines, en ligne en 7 jours. ${formatEur(prices.creationEur)} prix final, par un tourneur CN.`,
      url: OFFER_URL,
      type: 'website',
      structuredData: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            name: 'Site pro pour ateliers de mécanique',
            serviceType: 'Création de site vitrine',
            description:
              "Site vitrine pour ateliers d'usinage et de décolletage, en ligne en 7 jours, avec maintenance mensuelle.",
            url: OFFER_URL,
            provider: { '@type': 'Person', name: 'Julien Nédellec', url: SITE_IDENTITY.siteUrl },
            areaServed: [
              { '@type': 'AdministrativeArea', name: 'Yvelines' },
              { '@type': 'AdministrativeArea', name: 'Île-de-France' },
            ],
            offers: [
              {
                '@type': 'Offer',
                name: 'Création',
                price: String(prices.creationEur),
                priceCurrency: 'EUR',
              },
              {
                '@type': 'Offer',
                name: 'Maintenance',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: String(prices.maintenanceMonthlyEur),
                  priceCurrency: 'EUR',
                  unitCode: 'MON',
                },
              },
            ],
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Offres', item: CATALOGUE_URL },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Sites pour ateliers',
                item: OFFER_URL,
              },
            ],
          },
        ],
      },
    });
  });

  it('keeps the workshop demo out of the structured data, so that it never reads as a client reference', () => {
    const content = OFFER_PAGES['site-atelier'];
    const demoStrings = (content.examples?.items ?? []).flatMap(({ name, url, image }) => [
      name,
      url,
      image.file,
    ]);

    const serialized = JSON.stringify(
      toOfferSeo(offerSummaryOf('site-atelier'), content, OFFER_URL),
    );

    expect(demoStrings).toHaveLength(3);
    expect(demoStrings.filter((value) => serialized.includes(value))).toEqual([]);
  });

  it('builds the Service from the summary it is given and the url it is told', () => {
    const summary = makeOfferSummary({
      name: 'Autre offre',
      seo: { title: 'Autre offre | Julien Nédellec', description: 'Autre.', serviceType: 'Audit' },
    });
    const url = `${SITE_IDENTITY.siteUrl}/ailleurs`;

    const seo = toOfferSeo(summary, makeOfferPageContent(), url);
    const service = graphOf(seo.structuredData).find((node) => node['@type'] === 'Service');

    expect({
      url: seo.url,
      serviceUrl: service?.['url'],
      name: service?.['name'],
      serviceType: service?.['serviceType'],
    }).toEqual({ url, serviceUrl: url, name: 'Autre offre', serviceType: 'Audit' });
  });

  it('names the last breadcrumb after the offer when no breadcrumb name is given', () => {
    const summary = makeOfferSummary({ name: 'Offre sans fil' });

    const seo = toOfferSeo(summary, makeOfferPageContent(), OFFER_URL);
    const breadcrumb = graphOf(seo.structuredData).find(
      (node) => node['@type'] === 'BreadcrumbList',
    );

    expect(breadcrumb?.['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Offres', item: CATALOGUE_URL },
      { '@type': 'ListItem', position: 3, name: 'Offre sans fil', item: OFFER_URL },
    ]);
  });

  it('leaves the Service without description when none is given', () => {
    const seo = toOfferSeo(makeOfferSummary(), makeOfferPageContent(), OFFER_URL);
    const service = graphOf(seo.structuredData).find((node) => node['@type'] === 'Service');

    expect(service).toBeDefined();
    expect('description' in (service ?? {})).toBe(false);
  });

  it('derives one schema.org Offer per price line, monthly lines as a unit price', () => {
    const content = makeOfferPageContent({
      pricing: {
        heading: 'Tarif',
        lines: [
          makeOfferPriceLine({ id: 'a', name: 'Forfait', amount: { kind: 'fixed', eur: 1234 } }),
          makeOfferPriceLine({
            id: 'b',
            name: 'Suivi',
            amount: { kind: 'fixed', eur: 45 },
            period: 'month',
          }),
          makeOfferPriceLine({ id: 'c', name: 'Option', amount: { kind: 'fixed', eur: 80 } }),
        ],
      },
    });

    const seo = toOfferSeo(makeOfferSummary(), content, OFFER_URL);
    const service = graphOf(seo.structuredData).find((node) => node['@type'] === 'Service');

    expect(service?.['offers']).toEqual([
      { '@type': 'Offer', name: 'Forfait', price: '1234', priceCurrency: 'EUR' },
      {
        '@type': 'Offer',
        name: 'Suivi',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '45',
          priceCurrency: 'EUR',
          unitCode: 'MON',
        },
      },
      { '@type': 'Offer', name: 'Option', price: '80', priceCurrency: 'EUR' },
    ]);
  });

  it('derives offers from a minimum price, a monthly minimum and a price on request', () => {
    const content = makeOfferPageContent({
      pricing: {
        heading: 'Tarif',
        lines: [
          makeOfferPriceLine({ id: 'a', name: 'Projet', amount: { kind: 'from', eur: 4500 } }),
          makeOfferPriceLine({
            id: 'b',
            name: 'Suivi',
            amount: { kind: 'from', eur: 190 },
            period: 'month',
          }),
          makeOfferPriceLine({
            id: 'c',
            name: 'Régie',
            amount: { kind: 'on-request' },
            period: 'day',
          }),
        ],
      },
    });

    const seo = toOfferSeo(makeOfferSummary(), content, OFFER_URL);
    const service = graphOf(seo.structuredData).find((node) => node['@type'] === 'Service');

    expect(service?.['offers']).toEqual([
      {
        '@type': 'Offer',
        name: 'Projet',
        priceSpecification: {
          '@type': 'PriceSpecification',
          minPrice: '4500',
          priceCurrency: 'EUR',
        },
      },
      {
        '@type': 'Offer',
        name: 'Suivi',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          minPrice: '190',
          priceCurrency: 'EUR',
          unitCode: 'MON',
        },
      },
      { '@type': 'Offer', name: 'Régie' },
    ]);
  });

  it.each([
    [
      'sites',
      [
        { '@type': 'AdministrativeArea', name: 'Yvelines' },
        { '@type': 'AdministrativeArea', name: 'Île-de-France' },
      ],
    ],
    [
      'applications',
      [
        { '@type': 'AdministrativeArea', name: 'Yvelines' },
        { '@type': 'AdministrativeArea', name: 'Île-de-France' },
        { '@type': 'Country', name: 'France' },
      ],
    ],
  ] as const)('serves the %s family in its own area', (family, areaServed) => {
    const seo = toOfferSeo(makeOfferSummary({ family }), makeOfferPageContent(), OFFER_URL);
    const service = graphOf(seo.structuredData).find((node) => node['@type'] === 'Service');

    expect(service?.['areaServed']).toEqual(areaServed);
  });

  describe('offers of the catalogue', () => {
    const offersOf = (slug: OfferSlug): unknown =>
      graphOf(toOfferSeo(offerSummaryOf(slug), OFFER_PAGES[slug], OFFER_URL).structuredData).find(
        (node) => node['@type'] === 'Service',
      )?.['offers'];

    it('prices the showcase site creation once and its maintenance by the month', () => {
      const prices = OFFER_PRICES['site-vitrine'];
      expect(offersOf('site-vitrine')).toEqual([
        {
          '@type': 'Offer',
          name: 'Création',
          price: String(prices.creationEur),
          priceCurrency: 'EUR',
        },
        {
          '@type': 'Offer',
          name: 'Maintenance',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: String(prices.maintenanceMonthlyEur),
            priceCurrency: 'EUR',
            unitCode: 'MON',
          },
        },
      ]);
    });

    it('gives the business application and its maintenance their minimum price', () => {
      const prices = OFFER_PRICES['application-metier'];
      expect(offersOf('application-metier')).toEqual([
        {
          '@type': 'Offer',
          name: 'Projet',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: String(prices.projectFromEur),
            priceCurrency: 'EUR',
          },
        },
        {
          '@type': 'Offer',
          name: 'Maintenance',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            minPrice: String(prices.maintenanceMonthlyFromEur),
            priceCurrency: 'EUR',
            unitCode: 'MON',
          },
        },
      ]);
    });

    it('prices the audit, leaves the works unpriced and gives the maintenance its minimum', () => {
      const prices = OFFER_PRICES['refonte-maintenance'];
      expect(offersOf('refonte-maintenance')).toEqual([
        { '@type': 'Offer', name: 'Audit', price: String(prices.auditEur), priceCurrency: 'EUR' },
        { '@type': 'Offer', name: 'Chantiers' },
        {
          '@type': 'Offer',
          name: 'Maintenance',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            minPrice: String(prices.maintenanceMonthlyFromEur),
            priceCurrency: 'EUR',
            unitCode: 'MON',
          },
        },
      ]);
    });

    it('offers the reinforcement without any price', () => {
      expect(offersOf('renfort-freelance')).toEqual([{ '@type': 'Offer', name: 'Régie' }]);
    });
  });

  it.each(OFFERS)(
    'gives $slug a search snippet of at most 160 characters without em dash',
    (summary) => {
      const { description } = toOfferSeo(summary, OFFER_PAGES[summary.slug], OFFER_URL);
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description).not.toContain('—');
    },
  );
});

describe('toOfferCatalogueSeo', () => {
  const nodeOf = (seo: SeoData, type: string): JsonLdNode | undefined =>
    graphOf(seo.structuredData).find((node) => node['@type'] === type);
  const itemsOf = (seo: SeoData): unknown =>
    (nodeOf(seo, 'CollectionPage')?.['mainEntity'] as JsonLdNode | undefined)?.['itemListElement'];

  it('describes the catalogue page at its own url, with its validated title and snippet', () => {
    const seo = toOfferCatalogueSeo(OFFERS);

    expect(seo.url).toBe(CATALOGUE_URL);
    expect(seo.type).toBe('website');
    expect(seo.title).toBe('Offres et tarifs, sites et applications web | Julien Nédellec');
    expect(seo.description).toBe(
      `Sites en 7 jours dès ${formatEur(OFFER_PRICES['site-atelier'].creationEur)}, application métier dès ${formatEur(OFFER_PRICES['application-metier'].projectFromEur)}, refonte, maintenance et renfort Angular. Prix annoncé avant de commencer.`,
    );
    expect(graphOf(seo.structuredData).map((node) => node['@type'])).toEqual([
      'CollectionPage',
      'BreadcrumbList',
    ]);
    expect(seo.structuredData?.['@context']).toBe('https://schema.org');
  });

  it('gives the catalogue a search snippet of at most 160 characters without em dash', () => {
    const { description } = toOfferCatalogueSeo(OFFERS);
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain('—');
  });

  it('names the collection page after the catalogue heading, at the catalogue url, with the offers as its main entity', () => {
    const page = nodeOf(toOfferCatalogueSeo(OFFERS), 'CollectionPage');

    expect(page?.['name']).toBe('Cinq offres, un tarif annoncé avant de commencer.');
    expect(page?.['url']).toBe(CATALOGUE_URL);
    expect((page?.['mainEntity'] as JsonLdNode | undefined)?.['@type']).toBe('ItemList');
  });

  it('lists the url of every offer of the catalogue, in catalogue order', () => {
    expect(itemsOf(toOfferCatalogueSeo(OFFERS))).toEqual(
      OFFERS.map((summary, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: summary.name,
        url: `${SITE_IDENTITY.siteUrl}${offerPath(summary.slug)}`,
      })),
    );
  });

  it('lists only the offers it is given', () => {
    const offers = [
      makeOfferSummary({ slug: 'renfort-freelance', name: 'Renfort de test' }),
      makeOfferSummary({ slug: 'site-vitrine', name: 'Vitrine de test' }),
    ];

    expect(itemsOf(toOfferCatalogueSeo(offers))).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Renfort de test',
        url: `${SITE_IDENTITY.siteUrl}/offres/renfort-freelance`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Vitrine de test',
        url: `${SITE_IDENTITY.siteUrl}/offres/site-vitrine`,
      },
    ]);
  });

  it('places the catalogue under the home page in the breadcrumb', () => {
    expect(nodeOf(toOfferCatalogueSeo(OFFERS), 'BreadcrumbList')?.['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Offres', item: CATALOGUE_URL },
    ]);
  });
});

describe('toOfferCatalogJsonLd', () => {
  it('names the catalogue Offres, at the catalogue url', () => {
    const catalog = toOfferCatalogJsonLd(OFFERS);

    expect(catalog['@type']).toBe('OfferCatalog');
    expect(catalog['name']).toBe('Offres');
    expect(catalog['url']).toBe(CATALOGUE_URL);
  });

  it('offers every service of the catalogue at its page url, in catalogue order', () => {
    expect(toOfferCatalogJsonLd(OFFERS)['itemListElement']).toEqual(
      OFFERS.map((summary) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: summary.name,
          url: `${SITE_IDENTITY.siteUrl}${offerPath(summary.slug)}`,
        },
      })),
    );
  });

  it('lists only the offers it is given', () => {
    const offers = [
      makeOfferSummary({ slug: 'application-metier', name: 'Application de test' }),
      makeOfferSummary({ slug: 'site-atelier', name: 'Atelier de test' }),
    ];

    expect(toOfferCatalogJsonLd(offers)['itemListElement']).toEqual([
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Application de test',
          url: `${SITE_IDENTITY.siteUrl}/offres/application-metier`,
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Atelier de test',
          url: `${SITE_IDENTITY.siteUrl}/offres/site-atelier`,
        },
      },
    ]);
  });
});
