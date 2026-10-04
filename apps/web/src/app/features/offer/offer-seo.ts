import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { SeoData } from '@shared/seo/seo';
import type {
  OfferFamily,
  OfferPageContent,
  OfferPriceLine,
  OfferSummary,
} from './domain/models/offer.model';

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
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            { '@type': 'ListItem', position: 2, name: breadcrumbName ?? summary.name, item: url },
          ],
        },
      ],
    },
  };
}
