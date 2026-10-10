import { formatEur } from '@features/offer/domain/format-eur';
import { OFFER_PRICES } from '@features/offer/domain/offer-prices.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { STATIC_HERO } from './home.static-data';

describe('STATIC_HERO', () => {
  it('states the validated client promise as headline', () => {
    expect(STATIC_HERO.headline).toBe(
      'Votre site ou votre application web, à prix annoncé, en ligne vite.',
    );
  });

  it('accents the announced price, in the middle of the headline', () => {
    expect(STATIC_HERO.headlineAccent).toBe('à prix annoncé');
  });

  it('supports the promise with the validated lead: audience, showcase price, delays, then the journey', () => {
    const showcasePrice = formatEur(OFFER_PRICES['site-vitrine'].creationEur);

    expect(STATIC_HERO.lead).toBe(
      `Pour les TPE, les artisans et les ateliers des Yvelines et d'Île-de-France\u00a0: site vitrine à ${showcasePrice} prix final, en ligne en 7 jours, réponse sous 48\u00a0h ouvrées. ${SITE_IDENTITY.journey}`,
    );
  });
});
