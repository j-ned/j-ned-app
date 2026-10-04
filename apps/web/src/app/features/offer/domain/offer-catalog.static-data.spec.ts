import { formatEur } from './format-eur';
import { OFFERS, OFFER_FAMILY_LABELS, OFFER_FAMILY_LEADS } from './offer-catalog.static-data';
import { OFFER_PAGES } from './offer-pages.static-data';
import { OFFER_PRICES } from './offer-prices.static-data';
import { offerSummaryOf } from '../testing/offer-builders';

describe('OFFERS', () => {
  it('lists each slug once', () => {
    const slugs = OFFERS.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists exactly the offers that have a page', () => {
    expect(OFFERS.map(({ slug }) => slug).sort()).toEqual(Object.keys(OFFER_PAGES).sort());
  });

  it('orders the catalogue sites first, then applications, and features all but the workshop on the home page', () => {
    expect(
      OFFERS.map(({ slug, family, featuredOnHome }) => ({ slug, family, featuredOnHome })),
    ).toEqual([
      { slug: 'site-vitrine', family: 'sites', featuredOnHome: true },
      { slug: 'site-atelier', family: 'sites', featuredOnHome: false },
      { slug: 'application-metier', family: 'applications', featuredOnHome: true },
      { slug: 'refonte-maintenance', family: 'applications', featuredOnHome: true },
      { slug: 'renfort-freelance', family: 'applications', featuredOnHome: true },
    ]);
  });

  it('gives each offer a short name for compact lists', () => {
    expect(OFFERS.map(({ slug, shortName }) => ({ slug, shortName }))).toEqual([
      { slug: 'site-vitrine', shortName: 'Site vitrine' },
      { slug: 'site-atelier', shortName: 'Site atelier' },
      { slug: 'application-metier', shortName: 'Application métier' },
      { slug: 'refonte-maintenance', shortName: 'Refonte et maintenance' },
      { slug: 'renfort-freelance', shortName: 'Renfort Angular / NestJS' },
    ]);
  });

  it.each([
    [
      'site-vitrine',
      'Site vitrine pour TPE, PME et artisans',
      `${formatEur(OFFER_PRICES['site-vitrine'].creationEur)}, prix final`,
    ],
    [
      'application-metier',
      'Application métier sur mesure',
      `À partir de ${formatEur(OFFER_PRICES['application-metier'].projectFromEur)}`,
    ],
    [
      'refonte-maintenance',
      'Refonte, audit et maintenance',
      `Audit ${formatEur(OFFER_PRICES['refonte-maintenance'].auditEur)}, maintenance dès ${formatEur(OFFER_PRICES['refonte-maintenance'].maintenanceMonthlyFromEur)}/mois`,
    ],
    ['renfort-freelance', 'Renfort Angular / NestJS', 'TJM sur demande'],
  ] as const)('names %s and teases its price from OFFER_PRICES', (slug, name, priceTeaser) => {
    const offer = OFFERS.find((summary) => summary.slug === slug);
    expect({ name: offer?.name, priceTeaser: offer?.priceTeaser }).toEqual({ name, priceTeaser });
  });

  it.each([
    [
      'site-vitrine',
      [
        `${formatEur(OFFER_PRICES['site-vitrine'].creationEur)} prix final`,
        `${formatEur(OFFER_PRICES['site-vitrine'].maintenanceMonthlyEur)}/mois sans engagement`,
      ],
    ],
    [
      'application-metier',
      [`à partir de ${formatEur(OFFER_PRICES['application-metier'].projectFromEur)}`],
    ],
    [
      'refonte-maintenance',
      [
        formatEur(OFFER_PRICES['refonte-maintenance'].auditEur),
        `dès ${formatEur(OFFER_PRICES['refonte-maintenance'].maintenanceMonthlyFromEur)}/mois`,
      ],
    ],
    ['renfort-freelance', ['TJM sur demande']],
  ] as const)('states the price commitments of %s in its search snippet', (slug, commitments) => {
    const description = OFFERS.find((summary) => summary.slug === slug)?.seo.description ?? '';
    expect(commitments.filter((commitment) => !description.includes(commitment))).toEqual([]);
  });

  it('quotes no figure for the freelance reinforcement, whose day rate is given on request', () => {
    const { priceTeaser, seo } = offerSummaryOf('renfort-freelance');
    expect([priceTeaser, seo.description].filter((text) => /\d/.test(text))).toEqual([]);
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

describe('OFFER_FAMILY_LABELS', () => {
  it('names the two families of the catalogue', () => {
    expect(OFFER_FAMILY_LABELS).toEqual({ sites: 'Sites', applications: 'Applications' });
  });
});

describe('OFFER_FAMILY_LEADS', () => {
  it('says in one sentence what each family is for', () => {
    expect(OFFER_FAMILY_LEADS).toEqual({
      sites: 'Pour être trouvé sur Google et convaincre en trente secondes.',
      applications: 'Pour remplacer un tableur, outiller une équipe ou reprendre un existant.',
    });
  });
});
