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
});
