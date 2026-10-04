import { formatEur } from './format-eur';
import { OFFERS } from './offer-catalog.static-data';
import { OFFER_PAGES } from './offer-pages.static-data';
import { OFFER_PRICES } from './offer-prices.static-data';

describe('OFFERS', () => {
  it('lists each slug once', () => {
    const slugs = OFFERS.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists exactly the offers that have a page', () => {
    expect(OFFERS.map(({ slug }) => slug).sort()).toEqual(Object.keys(OFFER_PAGES).sort());
  });

  it('summarises the workshop offer as a site, kept off the home page', () => {
    const atelier = OFFERS.find(({ slug }) => slug === 'site-atelier');
    expect({
      family: atelier?.family,
      name: atelier?.name,
      priceTeaser: atelier?.priceTeaser,
      featuredOnHome: atelier?.featuredOnHome,
      serviceType: atelier?.seo.serviceType,
      description: atelier?.seo.description,
    }).toEqual({
      family: 'sites',
      name: 'Site pro pour ateliers de mécanique',
      priceTeaser: `${formatEur(OFFER_PRICES['site-atelier'].creationEur)}, prix final`,
      featuredOnHome: false,
      serviceType: 'Création de site vitrine',
      description: `Site vitrine pour ateliers d'usinage et de décolletage des Yvelines, en ligne en 7 jours. ${formatEur(OFFER_PRICES['site-atelier'].creationEur)} prix final, par un tourneur CN.`,
    });
  });
});
