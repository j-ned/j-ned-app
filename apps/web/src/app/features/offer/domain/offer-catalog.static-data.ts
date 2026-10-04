import { formatEur } from './format-eur';
import type { OfferSummary } from './models/offer.model';
import { OFFER_PRICES } from './offer-prices.static-data';

const WORKSHOP_CREATION = formatEur(OFFER_PRICES['site-atelier'].creationEur);

export const OFFERS: readonly OfferSummary[] = [
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
];
