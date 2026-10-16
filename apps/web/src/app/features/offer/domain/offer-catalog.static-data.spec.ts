import { formatEur } from './format-eur';
import type { OfferSummary } from './models/offer.model';
import {
  OFFERS,
  OFFER_CATALOGUE_LEAD,
  OFFER_FAMILY_LABELS,
  OFFER_FAMILY_LEADS,
} from './offer-catalog.static-data';
import { OFFER_PAGES } from './offer-pages.static-data';
import { OFFER_PRICES } from './offer-prices.static-data';
import { offerSummaryOf } from '../testing/offer-builders';

const EVOLUTION = 'evolution-application';
const EVOLUTION_FROM_EUR = 390;

const summaryOf = (slug: string): OfferSummary | undefined =>
  OFFERS.find((summary) => summary.slug === slug);

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
      { slug: EVOLUTION, family: 'applications', featuredOnHome: true },
      { slug: 'refonte-maintenance', family: 'applications', featuredOnHome: true },
      { slug: 'renfort-freelance', family: 'applications', featuredOnHome: true },
    ]);
  });

  it('gives each offer a short name for compact lists', () => {
    expect(OFFERS.map(({ slug, shortName }) => ({ slug, shortName }))).toEqual([
      { slug: 'site-vitrine', shortName: 'Site vitrine' },
      { slug: 'site-atelier', shortName: 'Site atelier' },
      { slug: EVOLUTION, shortName: "Évolution d'application" },
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
      EVOLUTION,
      "Évolution d'application existante",
      `À partir de ${formatEur(EVOLUTION_FROM_EUR)}`,
    ],
    [
      'refonte-maintenance',
      'Refonte, audit et maintenance',
      `Audit ${formatEur(OFFER_PRICES['refonte-maintenance'].auditEur)}, maintenance dès ${formatEur(OFFER_PRICES['refonte-maintenance'].maintenanceMonthlyFromEur)}/mois`,
    ],
    ['renfort-freelance', 'Renfort ponctuel Angular / NestJS', 'TJM sur demande'],
  ] as const)('names %s and teases its price from OFFER_PRICES', (slug, name, priceTeaser) => {
    const offer = summaryOf(slug);
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
      'refonte-maintenance',
      [
        formatEur(OFFER_PRICES['refonte-maintenance'].auditEur),
        `dès ${formatEur(OFFER_PRICES['refonte-maintenance'].maintenanceMonthlyFromEur)}/mois`,
      ],
    ],
    ['renfort-freelance', ['TJM sur demande']],
  ] as const)('states the price commitments of %s in its search snippet', (slug, commitments) => {
    const description = summaryOf(slug)?.seo.description ?? '';
    expect(commitments.filter((commitment) => !description.includes(commitment))).toEqual([]);
  });

  it('quotes no figure for the freelance reinforcement, whose day rate is given on request', () => {
    const { priceTeaser, seo } = offerSummaryOf('renfort-freelance');
    expect([priceTeaser, seo.description].filter((text) => /\d/.test(text))).toEqual([]);
  });

  it.each([
    ['site-vitrine', 'Votre site, à prix fixe et délai annoncé.'],
    ['site-atelier', 'Le site de votre atelier, à prix fixe et délai annoncé.'],
    [
      EVOLUTION,
      'Une fonctionnalité, un écran ou une correction ajoutés à votre application, à prix ferme.',
    ],
    ['renfort-freelance', 'Une tâche Angular ou NestJS confiée et livrée, le soir et le week-end.'],
  ])('promises on %s a price and a frame, not a delivery speed', (slug, promise) => {
    expect(summaryOf(slug)?.promise).toBe(promise);
  });

  it('presents the application evolution to the teams that already run an application', () => {
    const evolution = summaryOf(EVOLUTION);
    expect({
      audience: evolution?.audience,
      seo: {
        title: evolution?.seo.title,
        description: evolution?.seo.description,
        serviceType: evolution?.seo.serviceType,
        breadcrumbName: evolution?.seo.breadcrumbName,
      },
    }).toEqual({
      audience: 'PME et équipes qui ont déjà une application web',
      seo: {
        title: "Évolution d'application Angular et NestJS | Julien Nédellec",
        description: expect.stringMatching(/le soir et le week-end\.$/iu),
        serviceType: "Développement de fonctionnalités d'application web",
        breadcrumbName: "Évolution d'application",
      },
    });
  });

  it('presents the reinforcement as occasional remote tasks, evenings and weekends', () => {
    const reinforcement = summaryOf('renfort-freelance');
    expect({
      title: reinforcement?.seo.title,
      description: reinforcement?.seo.description,
    }).toEqual({
      title: 'Développeur Angular / NestJS freelance, missions ponctuelles | Julien Nédellec',
      description: expect.stringMatching(
        /^Développeur Angular et NestJS freelance, à distance, .*le soir et le week-end\./u,
      ),
    });
  });

  it('titles the showcase site search result on its fixed price, and dates its delivery by the quote', () => {
    const showcase = summaryOf('site-vitrine');
    expect({
      title: showcase?.seo.title,
      fixedByQuote: showcase?.seo.description.includes('délai fixé au devis'),
    }).toEqual({
      title: 'Création de site vitrine à prix fixe | Julien Nédellec',
      fixedByQuote: true,
    });
  });

  it('serves the rework remotely, in the evening and at the weekend, in its search snippet', () => {
    expect(summaryOf('refonte-maintenance')?.seo.description).toMatch(
      /Reprise de projets Angular et NestJS existants, à distance, le soir et le week-end\.$/u,
    );
  });

  it('summarises the workshop offer as a site, kept off the home page', () => {
    const atelier = summaryOf('site-atelier');
    expect({
      family: atelier?.family,
      name: atelier?.name,
      priceTeaser: atelier?.priceTeaser,
      featuredOnHome: atelier?.featuredOnHome,
      serviceType: atelier?.seo.serviceType,
      fixedByQuote: atelier?.seo.description.includes('délai fixé au devis'),
      price: atelier?.seo.description.includes(
        `${formatEur(OFFER_PRICES['site-atelier'].creationEur)} prix final`,
      ),
    }).toEqual({
      family: 'sites',
      name: 'Site pro pour ateliers de mécanique',
      priceTeaser: `${formatEur(OFFER_PRICES['site-atelier'].creationEur)}, prix final`,
      featuredOnHome: false,
      serviceType: 'Création de site vitrine',
      fixedByQuote: true,
      price: true,
    });
  });
});

describe('OFFER_CATALOGUE_LEAD', () => {
  it('says what each offer details, and that the delay is fixed by the quote', () => {
    expect(OFFER_CATALOGUE_LEAD).toMatch(
      /Chaque offre précise ce qui est livré, comment ça se passe et à quel prix\. Le délai est fixé au devis\.$/u,
    );
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
      applications: 'Pour faire évoluer, reprendre ou renforcer une application existante.',
    });
  });
});
