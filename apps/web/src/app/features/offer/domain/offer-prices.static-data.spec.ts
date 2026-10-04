import { OFFER_PRICES } from './offer-prices.static-data';

describe('OFFER_PRICES', () => {
  it('fixes the amounts of every offer, each maintenance priced on its own offer', () => {
    expect(OFFER_PRICES).toEqual({
      'site-vitrine': { creationEur: 890, maintenanceMonthlyEur: 29 },
      'site-atelier': { creationEur: 690, maintenanceMonthlyEur: 29 },
      'application-metier': { projectFromEur: 4500, maintenanceMonthlyFromEur: 190 },
      'refonte-maintenance': { auditEur: 450, maintenanceMonthlyFromEur: 190 },
      'renfort-freelance': {},
    });
  });
});
