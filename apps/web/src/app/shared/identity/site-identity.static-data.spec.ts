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

  it('exposes no availability nor review form any more (spec 029)', () => {
    expect(Object.keys(SITE_IDENTITY)).toEqual([
      'email',
      'phone',
      'location',
      'socials',
      'journey',
      'siteUrl',
      'business',
    ]);
  });

  it('states the career journey in one validated sentence, reused everywhere it is told', () => {
    expect(SITE_IDENTITY.journey).toBe(
      "Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, mon métier aujourd'hui, je suis aussi développeur web full-stack depuis 2025.",
    );
  });
});
