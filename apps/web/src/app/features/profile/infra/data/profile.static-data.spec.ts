import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { STATIC_ABOUT_HIGHLIGHTS, STATIC_BIOGRAPHY } from './profile.static-data';

describe('STATIC_BIOGRAPHY', () => {
  it('sums the journey up in the validated summary', () => {
    expect(STATIC_BIOGRAPHY.summary).toBe(
      "De la chaudronnerie au tournage CN dans l'aéronautique, et au développement web en parallèle\u00a0: la même exigence.",
    );
  });

  it('opens on the site-wide journey sentence, word for word', () => {
    expect(STATIC_BIOGRAPHY.lead).toBe(SITE_IDENTITY.journey);
  });

  it('emphasises the stack in the validated words', () => {
    expect(STATIC_BIOGRAPHY.leadEmphasis).toBe(
      "Angular et NestJS d'abord, PHP et Java aussi, en méthode agile.",
    );
  });

  it('tells the journey in the validated first paragraph', () => {
    expect(STATIC_BIOGRAPHY.paragraphs[0]).toBe(
      "Je ne suis pas venu au développement web par hasard. De la chaudronnerie au tournage CN de haute précision dans l'aéronautique, mon métier aujourd'hui, j'ai vu les outils numériques transformer un secteur entier. J'ai compris que je pouvais avoir plus d'impact en créant ces outils plutôt qu'en les utilisant.",
    );
  });
});

describe('STATIC_ABOUT_HIGHLIGHTS', () => {
  it('describes the overall vision without any career length', () => {
    expect(
      STATIC_ABOUT_HIGHLIGHTS.find(({ title }) => title === "Vision d'ensemble")?.description,
    ).toBe("Je ne code pas dans le vide. Je comprends le métier, l'architecture, les contraintes.");
  });
});
