import { OFFERS_BASE_PATH, offerPath } from './offer-path';

describe('offerPath', () => {
  it('roots the catalogue at /offres', () => {
    expect(OFFERS_BASE_PATH).toBe('offres');
  });

  it('places an offer under the catalogue, by its slug', () => {
    expect(offerPath('site-atelier')).toBe('/offres/site-atelier');
  });
});
