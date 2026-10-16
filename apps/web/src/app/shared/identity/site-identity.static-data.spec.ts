import { SITE_IDENTITY } from './site-identity.static-data';

describe('SITE_IDENTITY', () => {
  it('declares the professional status of the publisher', () => {
    expect(SITE_IDENTITY.business).toEqual({
      status: 'entrepreneur individuel',
      siret: '937 999 860 00029',
      ape: '62.01Z',
      vatMention: 'TVA non applicable, art. 293 B du CGI',
    });
  });

  it('states the availability as occasional missions, in the evening and at the weekend', () => {
    expect(SITE_IDENTITY.availability).toBe('Missions ponctuelles, le soir et le week-end');
  });

  it('exposes one availability only, for clients', () => {
    expect(Object.keys(SITE_IDENTITY)).toEqual([
      'email',
      'phone',
      'location',
      'socials',
      'availability',
      'journey',
      'googleReviewUrl',
      'siteUrl',
      'business',
    ]);
  });

  it('states the career journey in one validated sentence, reused everywhere it is told', () => {
    expect(SITE_IDENTITY.journey).toBe(
      "Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, mon métier aujourd'hui, je suis aussi développeur web full-stack depuis 2025.",
    );
  });

  it('points to the Google review form, the only place a client is invited to leave a review', () => {
    expect(SITE_IDENTITY.googleReviewUrl).toBe('https://g.page/r/Cdi5TzDRplmKECE/review');
  });
});
