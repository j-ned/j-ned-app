import { STATIC_HERO } from './home.static-data';

describe('STATIC_HERO', () => {
  it('states the validated client promise as headline', () => {
    expect(STATIC_HERO.headline).toBe(
      'Des sites et des applications web, livrés en production par un seul interlocuteur.',
    );
  });

  it('supports the promise with the validated lead', () => {
    expect(STATIC_HERO.lead).toBe(
      "Vingt ans d'industrie, aujourd'hui développeur full-stack. Je cadre, je construis, je mets en ligne et je maintiens. Vous savez ce que vous payez et quand c'est livré.",
    );
  });
});
