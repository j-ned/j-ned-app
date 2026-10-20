import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from './home-hero.static-data';

describe('home hero copy', () => {
  it('labels the blog then the projects calls to action, with no commercial wording', () => {
    expect(HOME_HERO_CTA_LABELS).toEqual({
      blog: 'Lire le blog',
      projects: 'Voir les réalisations',
    });
  });

  it('describes the profile in a technical sheet: trade, code, stack, hosting and rule', () => {
    expect(HOME_WORK_FRAME).toEqual({
      title: 'Fiche technique',
      reference: 'réf. JN-2026',
      rows: [
        { label: 'Métier', value: "Tourneur CN de haute précision, dans l'aéronautique" },
        { label: 'Code', value: 'Depuis 2025, titre Développeur Web et Web Mobile' },
        { label: 'Stack', value: 'Angular, NestJS, TypeScript, PostgreSQL' },
        { label: 'Hébergement', value: 'Auto-hébergé, Docker et Traefik' },
        {
          label: 'Règle',
          value: 'Une pièce hors tolérance ne part pas, un code non testé non plus',
        },
      ],
      dimension: "de l'atelier au code",
    });
  });
});
