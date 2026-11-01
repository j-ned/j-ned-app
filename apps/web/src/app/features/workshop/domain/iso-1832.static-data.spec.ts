import { describe, expect, it } from 'vitest';
import {
  ISO_1832_CLEARANCES,
  ISO_1832_FIXINGS,
  ISO_1832_NOSE_RADII,
  ISO_1832_SHAPES,
  ISO_1832_SIZES,
  ISO_1832_THICKNESSES,
  ISO_1832_TOLERANCES,
} from './iso-1832.static-data';

const KYOCERA_B1 =
  'https://asia.kyocera.com/products/cuttingtools/wp-content/uploads/2015/02/B-Turning-Indexable.pdf';
const MMC =
  'https://www.mitsubishicarbide.net/contents/mhg/enuk/html/product/product_guide/information/turning';

const TABLES = [
  ISO_1832_SHAPES,
  ISO_1832_CLEARANCES,
  ISO_1832_TOLERANCES,
  ISO_1832_FIXINGS,
  ISO_1832_SIZES,
  ISO_1832_THICKNESSES,
  ISO_1832_NOSE_RADII,
];

describe('ISO 1832 table', () => {
  it('Given the seven position tables When their positions are read Then they cover positions 1 to 7, in order, each with its label', () => {
    expect(TABLES.map(({ position, label }) => [position, label])).toEqual([
      [1, 'Forme'],
      [2, 'Dépouille'],
      [3, 'Tolérance'],
      [4, 'Fixation et brise-copeaux'],
      [5, 'Taille'],
      [6, 'Épaisseur'],
      [7, 'Rayon de bec'],
    ]);
  });

  it.each(TABLES.map((table) => [table.position, table]))(
    'Given position %i When its sources are read Then it cites the Mitsubishi Materials page and Kyocera p. B1, both concordant',
    (_, table) => {
      expect(table.sources.map(({ publisher }) => publisher)).toContain('Mitsubishi Materials');
      expect(table.sources.map(({ publisher }) => publisher)).toContain('Kyocera');
      expect(table.sources.map(({ url }) => url)).toContain(KYOCERA_B1);
    },
  );

  it.each([
    [1, `${MMC}/keijou.html`],
    [2, `${MMC}/nigekaku.html`],
    [
      3,
      'https://mitsubishicarbide.net/contents/mhg/ru/html/product/product_guide/information/turning/seido.html',
    ],
    [4, `${MMC}/mizo.html`],
    [5, `${MMC}/naisetsu.html`],
    [6, `${MMC}/swindow/tip_atsusa.html`],
    [7, `${MMC}/swindow/tip_corner.html`],
  ])(
    'Given position %i When its sources are read Then it links its Mitsubishi Materials page',
    (position, url) => {
      expect(TABLES[position - 1].sources.map((source) => source.url)).toContain(url);
    },
  );

  it('Given the shapes When read Then they are the letters written by both makers, with their acute angle', () => {
    expect(ISO_1832_SHAPES.entries).toEqual({
      A: 'Parallélogramme 85°',
      B: 'Parallélogramme 82°',
      C: 'Losange 80°',
      D: 'Losange 55°',
      E: 'Losange 75°',
      F: 'Losange 50°',
      H: 'Hexagone',
      K: 'Parallélogramme 55°',
      L: 'Rectangle',
      M: 'Losange 86°',
      O: 'Octogone',
      P: 'Pentagone',
      R: 'Rond',
      S: 'Carré (90°)',
      T: 'Triangle (60°)',
      V: 'Losange 35°',
      W: 'Trigone',
    });
  });

  it('Given the clearances When read Then they are the nine concordant angles, without the Mitsubishi-only « other »', () => {
    expect(ISO_1832_CLEARANCES.entries).toEqual({
      A: 'Dépouille 3°',
      B: 'Dépouille 5°',
      C: 'Dépouille 7°',
      D: 'Dépouille 15°',
      E: 'Dépouille 20°',
      F: 'Dépouille 25°',
      G: 'Dépouille 30°',
      N: 'Dépouille 0°',
      P: 'Dépouille 11°',
    });
  });

  it.each([
    [
      'A',
      'Classe A\u00a0: hauteur de bec ±0,005\u00a0mm, cercle inscrit ±0,025\u00a0mm, épaisseur ±0,025\u00a0mm',
    ],
    [
      'G',
      'Classe G\u00a0: hauteur de bec ±0,025\u00a0mm, cercle inscrit ±0,025\u00a0mm, épaisseur ±0,13\u00a0mm',
    ],
    [
      'M',
      'Classe M\u00a0: hauteur de bec ±0,08 à ±0,18\u00a0mm, cercle inscrit ±0,05 à ±0,15\u00a0mm, épaisseur ±0,13\u00a0mm, périphérie brute de frittage',
    ],
    [
      'U',
      'Classe U\u00a0: hauteur de bec ±0,13 à ±0,38\u00a0mm, cercle inscrit ±0,08 à ±0,25\u00a0mm, épaisseur ±0,13\u00a0mm, périphérie brute de frittage',
    ],
  ] as const)(
    'Given tolerance class %s When read Then it gives the three tolerances',
    (code, meaning) => {
      expect(ISO_1832_TOLERANCES.entries[code]).toBe(meaning);
    },
  );

  it('Given the tolerances When listed Then they are the twelve classes of both makers', () => {
    expect(Object.keys(ISO_1832_TOLERANCES.entries).sort()).toEqual(
      ['A', 'C', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'U'].sort(),
    );
  });

  it('Given the fixings When listed Then they are the fifteen letters of both makers, countersinks only where Mitsubishi writes them', () => {
    expect(ISO_1832_FIXINGS.entries).toEqual({
      A: 'Trou cylindrique, sans brise-copeaux',
      B: 'Trou cylindrique avec une fraisure de 70 à 90°, sans brise-copeaux',
      C: 'Trou cylindrique avec deux fraisures de 70 à 90°, sans brise-copeaux',
      F: 'Sans trou, brise-copeaux deux faces',
      G: 'Trou cylindrique, brise-copeaux deux faces',
      H: 'Trou de fixation, brise-copeaux une face',
      J: 'Trou de fixation, brise-copeaux deux faces',
      M: 'Trou cylindrique, brise-copeaux une face',
      N: 'Sans trou, sans brise-copeaux',
      Q: 'Trou cylindrique avec deux fraisures de 40 à 60°, sans brise-copeaux',
      R: 'Sans trou, brise-copeaux une face',
      T: 'Trou de fixation, brise-copeaux une face',
      U: 'Trou de fixation, brise-copeaux deux faces',
      W: 'Trou cylindrique avec une fraisure de 40 à 60°, sans brise-copeaux',
      X: 'Conception spéciale',
    });
  });

  it('Given the sizes When read Then each sized shape maps its edge code to the inscribed circle, without the unverified 7,94 mm row nor the round inserts', () => {
    expect(ISO_1832_SIZES.inscribedCircles).toEqual({
      C: {
        '06': '6,35',
        '09': '9,525',
        '12': '12,70',
        '16': '15,875',
        '19': '19,05',
        '25': '25,40',
      },
      D: {
        '07': '6,35',
        '11': '9,525',
        '15': '12,70',
        '19': '15,875',
        '23': '19,05',
        '31': '25,40',
      },
      S: {
        '06': '6,35',
        '09': '9,525',
        '12': '12,70',
        '15': '15,875',
        '19': '19,05',
        '25': '25,40',
      },
      T: {
        '11': '6,35',
        '16': '9,525',
        '22': '12,70',
        '27': '15,875',
        '33': '19,05',
        '44': '25,40',
      },
      V: {
        '11': '6,35',
        '16': '9,525',
        '22': '12,70',
        '27': '15,875',
        '33': '19,05',
        '44': '25,40',
      },
      W: {
        '04': '6,35',
        '06': '9,525',
        '08': '12,70',
        '10': '15,875',
        '13': '19,05',
        '17': '25,40',
      },
    });
  });

  it('Given the thicknesses When read Then only the codes common to both makers are there', () => {
    expect(ISO_1832_THICKNESSES.entries).toEqual({
      '01': 'Épaisseur 1,59\u00a0mm',
      '02': 'Épaisseur 2,38\u00a0mm',
      T2: 'Épaisseur 2,78\u00a0mm',
      '03': 'Épaisseur 3,18\u00a0mm',
      T3: 'Épaisseur 3,97\u00a0mm',
      '04': 'Épaisseur 4,76\u00a0mm',
      '06': 'Épaisseur 6,35\u00a0mm',
      '07': 'Épaisseur 7,94\u00a0mm',
      '09': 'Épaisseur 9,52\u00a0mm',
    });
  });

  it('Given the nose radii When read Then only the codes common to both makers are there, without micro-radii nor the round-insert M0', () => {
    expect(ISO_1832_NOSE_RADII.entries).toEqual({
      '00': 'Bec vif',
      '01': 'Rayon de bec 0,1\u00a0mm',
      '02': 'Rayon de bec 0,2\u00a0mm',
      '04': 'Rayon de bec 0,4\u00a0mm',
      '08': 'Rayon de bec 0,8\u00a0mm',
      '12': 'Rayon de bec 1,2\u00a0mm',
      '16': 'Rayon de bec 1,6\u00a0mm',
      '20': 'Rayon de bec 2\u00a0mm',
      '24': 'Rayon de bec 2,4\u00a0mm',
      '28': 'Rayon de bec 2,8\u00a0mm',
      '32': 'Rayon de bec 3,2\u00a0mm',
    });
  });
});
