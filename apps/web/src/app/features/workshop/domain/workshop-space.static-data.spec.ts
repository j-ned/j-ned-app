import { describe, expect, expectTypeOf, it } from 'vitest';
import type { WorkshopSpace } from './models/workshop-space.model';
import { WORKSHOP_SPACE } from './workshop-space.static-data';

describe('WORKSHOP_SPACE', () => {
  it('Given the workshop space When its type is read Then it is the workshop space model', () => {
    expectTypeOf(WORKSHOP_SPACE).toEqualTypeOf<WorkshopSpace>();
  });

  it('Given the workshop space When its heading is read Then the space is named « L’atelier »', () => {
    expect(WORKSHOP_SPACE.heading).toBe("L'atelier");
  });

  it('Given the workshop space When its intro is read Then no paragraph is blank or padded with spaces', () => {
    expect(
      WORKSHOP_SPACE.intro.filter(
        (paragraph) => paragraph === '' || paragraph !== paragraph.trim(),
      ),
    ).toEqual([]);
  });

  it('Given the workshop space When its tools section is read Then it is titled « Les outils »', () => {
    expect(WORKSHOP_SPACE.toolsHeading).toBe('Les outils');
  });

  it('Given the workshop space When its tools are read Then the insert guide card comes first, then the decoder card, each with its overline, title and summary', () => {
    expect(WORKSHOP_SPACE.tools).toEqual([
      {
        id: 'insert-guide',
        overline: 'Outil',
        title: 'Guide des plaquettes',
        summary:
          "Choisis ta matière\u00a0: le guide te donne les plaquettes que j'utilise, opération par opération.",
        path: '/atelier/plaquettes',
      },
      {
        id: 'insert-decoder',
        overline: 'Outil',
        title: 'Décodeur de plaquette',
        summary:
          "Tape le code ISO d'une plaquette\u00a0: je t'explique ce que veut dire chaque lettre et chaque chiffre.",
        path: '/atelier/decodeur',
      },
    ]);
  });
});
