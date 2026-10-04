import { OFFER_PRICES } from './offer-prices.static-data';

describe('OFFER_PRICES', () => {
  it('fixes the workshop creation price and its monthly maintenance', () => {
    expect(OFFER_PRICES).toEqual({
      'site-atelier': { creationEur: 690, maintenanceMonthlyEur: 29 },
    });
  });
});
