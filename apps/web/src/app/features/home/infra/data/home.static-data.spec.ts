import { formatEur } from '@features/offer/domain/format-eur';
import { OFFER_PRICES } from '@features/offer/domain/offer-prices.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { STATIC_HERO } from './home.static-data';

describe('STATIC_HERO', () => {
  it('states the validated client promise as headline', () => {
    expect(STATIC_HERO.headline).toBe(
      'Votre site ou votre application web, à prix annoncé, sur un délai tenu.',
    );
  });

  it('accents the announced price, in the middle of the headline', () => {
    expect(STATIC_HERO.headlineAccent).toBe('à prix annoncé');
  });

  it('supports the promise with the validated lead: the journey, the evening and weekend frame, then the showcase price', () => {
    const showcasePrice = formatEur(OFFER_PRICES['site-vitrine'].creationEur);

    expect(STATIC_HERO.lead).toBe(
      `${SITE_IDENTITY.journey} Je prends des missions freelance ponctuelles, le soir et le week-end, avec une charge limitée. Pour les TPE, les artisans et les ateliers\u00a0: site vitrine à ${showcasePrice} prix final, périmètre, délai et prix fixés au devis avant de commencer.`,
    );
  });
});
