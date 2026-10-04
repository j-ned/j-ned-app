import type { OfferSlug } from './models/offer.model';

export const OFFER_PRICES = {
  'site-vitrine': { creationEur: 890, maintenanceMonthlyEur: 29 },
  'site-atelier': { creationEur: 690, maintenanceMonthlyEur: 29 },
  'application-metier': { projectFromEur: 4500, maintenanceMonthlyFromEur: 190 },
  'refonte-maintenance': { auditEur: 450, maintenanceMonthlyFromEur: 190 },
  'renfort-freelance': {},
} as const satisfies Record<OfferSlug, Record<string, number>>;
