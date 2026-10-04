import { formatEur } from './format-eur';
import type { OfferSummary } from './models/offer.model';
import { OFFER_PRICES } from './offer-prices.static-data';

const SHOWCASE_CREATION = formatEur(OFFER_PRICES['site-vitrine'].creationEur);
const SHOWCASE_MAINTENANCE = formatEur(OFFER_PRICES['site-vitrine'].maintenanceMonthlyEur);
const WORKSHOP_CREATION = formatEur(OFFER_PRICES['site-atelier'].creationEur);
const APPLICATION_FROM = formatEur(OFFER_PRICES['application-metier'].projectFromEur);
const AUDIT = formatEur(OFFER_PRICES['refonte-maintenance'].auditEur);
const REWORK_MAINTENANCE_FROM = formatEur(
  OFFER_PRICES['refonte-maintenance'].maintenanceMonthlyFromEur,
);

export const OFFERS: readonly OfferSummary[] = [
  {
    slug: 'site-vitrine',
    family: 'sites',
    name: 'Site vitrine pour TPE, PME et artisans',
    audience: 'TPE, PME, artisans et professions libérales',
    promise: 'Votre site, en ligne en 7 jours.',
    priceTeaser: `${SHOWCASE_CREATION}, prix final`,
    featuredOnHome: true,
    seo: {
      title: 'Création de site vitrine en 7 jours | Julien Nédellec',
      description: `Site vitrine pour TPE, PME et artisans des Yvelines et d'Île-de-France, en ligne en 7 jours. ${SHOWCASE_CREATION} prix final, maintenance ${SHOWCASE_MAINTENANCE}/mois sans engagement.`,
      serviceType: 'Création de site vitrine',
      serviceDescription:
        'Site vitrine pour TPE, PME et artisans, en ligne en 7 jours, avec maintenance mensuelle.',
      breadcrumbName: 'Site vitrine',
    },
  },
  {
    slug: 'site-atelier',
    family: 'sites',
    name: 'Site pro pour ateliers de mécanique',
    audience: "Ateliers d'usinage, de décolletage et de mécanique de précision",
    promise: 'Le site de votre atelier, en ligne en 7 jours.',
    priceTeaser: `${WORKSHOP_CREATION}, prix final`,
    featuredOnHome: false,
    seo: {
      title: 'Site pro pour ateliers de mécanique | Julien Nédellec',
      description: `Site vitrine pour ateliers d'usinage et de décolletage des Yvelines, en ligne en 7 jours. ${WORKSHOP_CREATION} prix final, par un tourneur CN.`,
      serviceType: 'Création de site vitrine',
      serviceDescription:
        "Site vitrine pour ateliers d'usinage et de décolletage, en ligne en 7 jours, avec maintenance mensuelle.",
      breadcrumbName: 'Sites pour ateliers',
    },
  },
  {
    slug: 'application-metier',
    family: 'applications',
    name: 'Application métier sur mesure',
    audience: 'PME, équipes métier et fondateurs',
    promise: "L'outil qui remplace vos tableurs et vos ressaisies.",
    priceTeaser: `À partir de ${APPLICATION_FROM}`,
    featuredOnHome: true,
    seo: {
      title: 'Application métier sur mesure, Angular et NestJS | Julien Nédellec',
      description: `Outil interne, back-office ou portail client développé sur mesure en Angular et NestJS. Devis ferme après cadrage, à partir de ${APPLICATION_FROM}.`,
      serviceType: "Développement d'application web sur mesure",
      serviceDescription:
        'Outil interne, back-office ou portail client sur mesure, du cadrage à la mise en production et à la maintenance.',
      breadcrumbName: 'Application métier',
    },
  },
  {
    slug: 'refonte-maintenance',
    family: 'applications',
    name: 'Refonte, audit et maintenance',
    audience: 'Entreprises qui ont déjà une application web',
    promise: 'Reprendre une application existante, la sécuriser et la faire durer.',
    priceTeaser: `Audit ${AUDIT}, maintenance dès ${REWORK_MAINTENANCE_FROM}/mois`,
    featuredOnHome: true,
    seo: {
      title: "Audit, refonte et maintenance d'application web | Julien Nédellec",
      description: `Audit d'application web à ${AUDIT}, refonte et maintenance dès ${REWORK_MAINTENANCE_FROM}/mois. Reprise de projets Angular et NestJS existants, en Île-de-France et à distance.`,
      serviceType: "Audit et maintenance d'application web",
      serviceDescription:
        "Audit, modernisation et maintenance d'applications web existantes, en priorité Angular et NestJS.",
      breadcrumbName: 'Refonte et maintenance',
    },
  },
  {
    slug: 'renfort-freelance',
    family: 'applications',
    name: 'Renfort Angular / NestJS',
    audience: 'Équipes produit, CTO et ESN',
    promise: 'Un développeur full-stack Angular et NestJS pour renforcer votre équipe.',
    priceTeaser: 'TJM sur demande',
    featuredOnHome: true,
    seo: {
      title: 'Développeur Angular / NestJS freelance en régie | Julien Nédellec',
      description:
        'Développeur full-stack Angular et NestJS en freelance, en régie à distance ou sur site en Île-de-France. TJM sur demande, contrat direct ou via Malt.',
      serviceType: 'Développement logiciel en régie',
      serviceDescription:
        'Renfort développeur full-stack Angular et NestJS en régie, à distance ou sur site en Île-de-France.',
      breadcrumbName: 'Renfort freelance',
    },
  },
];
