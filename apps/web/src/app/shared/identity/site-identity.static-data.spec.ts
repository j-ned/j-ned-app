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

  it('states the availability for new client projects', () => {
    expect(SITE_IDENTITY.availability).toBe(
      'Disponible pour de nouveaux projets, démarrage sous 2 semaines',
    );
  });

  it('states the CDI opening for recruiters in its own availability', () => {
    expect(SITE_IDENTITY.hiringAvailability).toMatch(/\bCDI\b/);
  });

  it('states the career journey in one validated sentence, reused everywhere it is told', () => {
    expect(SITE_IDENTITY.journey).toBe(
      "Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, je suis aussi développeur web full-stack, issu d'une reconversion.",
    );
  });

  it('points to the Google review form, the only place a client is invited to leave a review', () => {
    expect(SITE_IDENTITY.googleReviewUrl).toBe('https://g.page/r/Cdi5TzDRplmKECE/review');
  });
});
