import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { SeoData } from '@shared/seo/seo';
import type { OfferPageContent, OfferPriceLine, OfferSummary } from './domain/models/offer.model';

function toSchemaOffer({ name, amount, period }: OfferPriceLine): Record<string, unknown> {
  const price = String(amount.eur);
  return period === 'month'
    ? {
        '@type': 'Offer',
        name,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price,
          priceCurrency: 'EUR',
          unitCode: 'MON',
        },
      }
    : { '@type': 'Offer', name, price, priceCurrency: 'EUR' };
}

export function toOfferSeo(
  summary: OfferSummary,
  content: OfferPageContent,
  url: string,
): SeoData {
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
          areaServed: [
            { '@type': 'AdministrativeArea', name: 'Yvelines' },
            { '@type': 'AdministrativeArea', name: 'Île-de-France' },
          ],
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
