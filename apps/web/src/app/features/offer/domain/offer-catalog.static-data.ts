import { formatEur } from './format-eur';
import type { OfferFamily, OfferSummary } from './models/offer.model';
import { OFFER_PRICES } from './offer-prices.static-data';

const SHOWCASE_CREATION = formatEur(OFFER_PRICES['site-vitrine'].creationEur);
const SHOWCASE_MAINTENANCE = formatEur(OFFER_PRICES['site-vitrine'].maintenanceMonthlyEur);
const WORKSHOP_CREATION = formatEur(OFFER_PRICES['site-atelier'].creationEur);
const EVOLUTION_FROM = formatEur(OFFER_PRICES['evolution-application'].projectFromEur);
const AUDIT = formatEur(OFFER_PRICES['refonte-maintenance'].auditEur);
const REWORK_MAINTENANCE_FROM = formatEur(
  OFFER_PRICES['refonte-maintenance'].maintenanceMonthlyFromEur,
);

export const OFFER_CATALOGUE_HEADING = 'Cinq offres, un tarif annoncé avant de commencer.';

export const OFFER_CATALOGUE_LEAD =
  'Un site pour être trouvé, ou une application pour travailler mieux. Chaque offre précise ce qui est livré, comment ça se passe et à quel prix. Le délai est fixé au devis.';

export const OFFER_FAMILY_LEADS: Readonly<Record<OfferFamily, string>> = {
  sites: 'Pour être trouvé sur Google et convaincre en trente secondes.',
  applications: 'Pour faire évoluer, reprendre ou renforcer une application existante.',
};

export const OFFER_FAMILY_LABELS: Readonly<Record<OfferFamily, string>> = {
  sites: 'Sites',
  applications: 'Applications',
};

export const OFFERS: readonly OfferSummary[] = [
  {
    slug: 'site-vitrine',
    family: 'sites',
    name: 'Site vitrine pour TPE, PME et artisans',
    shortName: 'Site vitrine',
    audience: 'TPE, PME, artisans et professions libérales',
    promise: 'Votre site, à prix fixe et délai annoncé.',
    priceTeaser: `${SHOWCASE_CREATION}, prix final`,
    featuredOnHome: true,
    seo: {
      title: 'Création de site vitrine à prix fixe | Julien Nédellec',
      description: `Site vitrine pour TPE, PME et artisans des Yvelines et d'Île-de-France, délai fixé au devis. ${SHOWCASE_CREATION} prix final, maintenance ${SHOWCASE_MAINTENANCE}/mois sans engagement.`,
      serviceType: 'Création de site vitrine',
      serviceDescription: 'Site vitrine pour TPE, PME et artisans, avec maintenance mensuelle.',
      breadcrumbName: 'Site vitrine',
    },
  },
  {
    slug: 'site-atelier',
    family: 'sites',
    name: 'Site pro pour ateliers de mécanique',
    shortName: 'Site atelier',
    audience: "Ateliers d'usinage, de décolletage et de mécanique de précision",
    promise: 'Le site de votre atelier, à prix fixe et délai annoncé.',
    priceTeaser: `${WORKSHOP_CREATION}, prix final`,
    featuredOnHome: false,
    seo: {
      title: 'Site pro pour ateliers de mécanique | Julien Nédellec',
      description: `Site vitrine pour ateliers d'usinage et de décolletage des Yvelines, délai fixé au devis. ${WORKSHOP_CREATION} prix final, par un tourneur CN.`,
      serviceType: 'Création de site vitrine',
      serviceDescription:
        "Site vitrine pour ateliers d'usinage et de décolletage, avec maintenance mensuelle.",
      breadcrumbName: 'Sites pour ateliers',
    },
  },
  {
    slug: 'evolution-application',
    family: 'applications',
    name: "Évolution d'application existante",
    shortName: "Évolution d'application",
    audience: 'PME et équipes qui ont déjà une application web',
    promise:
      'Une fonctionnalité, un écran ou une correction ajoutés à votre application, à prix ferme.',
    priceTeaser: `À partir de ${EVOLUTION_FROM}`,
    featuredOnHome: true,
    seo: {
      title: "Évolution d'application Angular et NestJS | Julien Nédellec",
      description:
        'Ajout de fonctionnalité ou correction sur une application Angular ou NestJS existante. Devis ferme après un cadrage gratuit. Le soir et le week-end.',
      serviceType: "Développement de fonctionnalités d'application web",
      breadcrumbName: "Évolution d'application",
    },
  },
  {
    slug: 'refonte-maintenance',
    family: 'applications',
    name: 'Refonte, audit et maintenance',
    shortName: 'Refonte et maintenance',
    audience: 'Entreprises qui ont déjà une application web',
    promise: 'Reprendre une application existante, la sécuriser et la faire durer.',
    priceTeaser: `Audit ${AUDIT}, maintenance dès ${REWORK_MAINTENANCE_FROM}/mois`,
    featuredOnHome: true,
    seo: {
      title: "Audit, refonte et maintenance d'application web | Julien Nédellec",
      description: `Audit d'application web à ${AUDIT}, refonte et maintenance dès ${REWORK_MAINTENANCE_FROM}/mois. Reprise de projets Angular et NestJS existants, à distance, le soir et le week-end.`,
      serviceType: "Audit et maintenance d'application web",
      serviceDescription:
        "Audit, modernisation et maintenance d'applications web existantes, en priorité Angular et NestJS.",
      breadcrumbName: 'Refonte et maintenance',
    },
  },
  {
    slug: 'renfort-freelance',
    family: 'applications',
    name: 'Renfort ponctuel Angular / NestJS',
    shortName: 'Renfort Angular / NestJS',
    audience: 'Équipes produit, CTO et ESN',
    promise: 'Une tâche Angular ou NestJS confiée et livrée, le soir et le week-end.',
    priceTeaser: 'TJM sur demande',
    featuredOnHome: true,
    seo: {
      title: 'Développeur Angular / NestJS freelance, missions ponctuelles | Julien Nédellec',
      description:
        'Développeur Angular et NestJS freelance, à distance, pour des tâches ponctuelles livrées le soir et le week-end. TJM sur demande, en direct ou via Malt.',
      serviceType: 'Développement Angular et NestJS à distance',
      serviceDescription:
        'Renfort développeur full-stack Angular et NestJS, à distance, pour des tâches ponctuelles.',
      breadcrumbName: 'Renfort freelance',
    },
  },
];
