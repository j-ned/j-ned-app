import type { OfferSlug } from './models/offer.model';

export const OFFER_PRICES = {
  'site-atelier': { creationEur: 690, maintenanceMonthlyEur: 29 },
} as const satisfies Record<OfferSlug, Record<string, number>>;
