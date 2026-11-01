import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { STATIC_HERO } from './home.static-data';

describe('STATIC_HERO', () => {
  it('states the validated headline (spec 029)', () => {
    expect(STATIC_HERO.headline).toBe('Tourneur CN le jour, développeur web le reste du temps.');
  });

  it('accents « développeur web », in the middle of the headline', () => {
    expect(STATIC_HERO.headlineAccent).toBe('développeur web');
  });

  it('supports the headline with the journey, then what the site is about', () => {
    expect(STATIC_HERO.lead).toBe(
      `${SITE_IDENTITY.journey} Ici, je raconte ce que je construis avec Angular, NestJS et PostgreSQL, et comment je l'héberge chez moi\u00a0: le code, les choix, et les erreurs en chemin.`,
    );
  });

  it.each([/freelance/i, /devis/i, /prix/i, /mission/i, /TPE/])(
    'never sells anything: the lead does not match %s',
    (pattern) => {
      expect(STATIC_HERO.lead).not.toMatch(pattern);
    },
  );
});
