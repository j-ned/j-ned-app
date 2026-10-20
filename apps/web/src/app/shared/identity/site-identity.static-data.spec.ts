import { SITE_IDENTITY } from './site-identity.static-data';

describe('SITE_IDENTITY', () => {
  it('exposes no business identity, phone, availability nor review form any more (spec 029)', () => {
    expect(Object.keys(SITE_IDENTITY)).toEqual([
      'email',
      'location',
      'socials',
      'journey',
      'siteUrl',
    ]);
  });

  it('links public profiles only, without Malt', () => {
    expect(Object.keys(SITE_IDENTITY.socials)).toEqual(['github', 'linkedin', 'discord']);
  });

  it('states the career journey in one validated sentence, reused everywhere it is told', () => {
    expect(SITE_IDENTITY.journey).toBe(
      "Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, mon métier aujourd'hui, je suis aussi développeur web full-stack depuis 2025.",
    );
  });
});
