import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { SeoData } from '@core/seo/seo';
import type {
  OfferFamily,
  OfferPageContent,
  OfferPriceLine,
  OfferSummary,
} from './domain/models/offer.model';
import { formatEur } from './domain/format-eur';
import { OFFER_CATALOGUE_HEADING } from './domain/offer-catalog.static-data';
import { OFFERS_BASE_PATH, offerPath } from './domain/offer-path';
import { OFFER_PRICES } from './domain/offer-prices.static-data';

function toSchemaOffer({ name, amount, period }: OfferPriceLine): Record<string, unknown> {
  if (amount.kind === 'on-request') return { '@type': 'Offer', name };
  const priceKey = amount.kind === 'from' ? 'minPrice' : 'price';
  const price = { [priceKey]: String(amount.eur), priceCurrency: 'EUR' };
  if (period === 'month') {
    return {
      '@type': 'Offer',
      name,
      priceSpecification: { '@type': 'UnitPriceSpecification', ...price, unitCode: 'MON' },
    };
  }
  return amount.kind === 'from'
    ? { '@type': 'Offer', name, priceSpecification: { '@type': 'PriceSpecification', ...price } }
    : { '@type': 'Offer', name, ...price };
}

const CATALOGUE_URL = `${SITE_IDENTITY.siteUrl}/${OFFERS_BASE_PATH}`;

const HOME_CRUMB = {
  '@type': 'ListItem',
  position: 1,
  name: 'Accueil',
  item: SITE_IDENTITY.siteUrl,
};
const CATALOGUE_CRUMB = { '@type': 'ListItem', position: 2, name: 'Offres', item: CATALOGUE_URL };

const REGIONS_SERVED = [
  { '@type': 'AdministrativeArea', name: 'Yvelines' },
  { '@type': 'AdministrativeArea', name: 'Île-de-France' },
];

const AREAS_SERVED: Record<OfferFamily, readonly Record<string, string>[]> = {
  sites: REGIONS_SERVED,
  applications: [...REGIONS_SERVED, { '@type': 'Country', name: 'France' }],
};

export function toOfferSeo(summary: OfferSummary, content: OfferPageContent, url: string): SeoData {
  const { title, description, serviceType, serviceDescription, breadcrumbName } = summary.seo;
  return {
    title,
    description,
    url,
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          name: summary.name,
          serviceType,
          ...(serviceDescription && { description: serviceDescription }),
          url,
          provider: { '@type': 'Person', name: 'Julien Nédellec', url: SITE_IDENTITY.siteUrl },
          areaServed: AREAS_SERVED[summary.family],
          offers: content.pricing.lines.map(toSchemaOffer),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            HOME_CRUMB,
            CATALOGUE_CRUMB,
            { '@type': 'ListItem', position: 3, name: breadcrumbName ?? summary.name, item: url },
          ],
        },
      ],
    },
  };
}

export function toOfferCatalogueSeo(offers: readonly OfferSummary[]): SeoData {
  return {
    title: 'Offres et tarifs, sites et applications web | Julien Nédellec',
    description: `Sites en 7 jours dès ${formatEur(OFFER_PRICES['site-atelier'].creationEur)}, application métier dès ${formatEur(OFFER_PRICES['application-metier'].projectFromEur)}, refonte, maintenance et renfort Angular. Prix annoncé avant de commencer.`,
    url: CATALOGUE_URL,
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: OFFER_CATALOGUE_HEADING,
          url: CATALOGUE_URL,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: offers.map((summary, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: summary.name,
              url: `${SITE_IDENTITY.siteUrl}${offerPath(summary.slug)}`,
            })),
          },
        },
        { '@type': 'BreadcrumbList', itemListElement: [HOME_CRUMB, CATALOGUE_CRUMB] },
      ],
    },
  };
}

export function toOfferCatalogJsonLd(offers: readonly OfferSummary[]): Record<string, unknown> {
  return {
    '@type': 'OfferCatalog',
    name: 'Offres',
    url: CATALOGUE_URL,
    itemListElement: offers.map((summary) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: summary.name,
        url: `${SITE_IDENTITY.siteUrl}${offerPath(summary.slug)}`,
      },
    })),
  };
}
