import { describe, expect, it } from 'vitest';
import { decodeInsertCode, textAfterInsertCode, normalizeInsertCode } from './decode-insert-code';
import {
  ISO_1832_CLEARANCES,
  ISO_1832_FIXINGS,
  ISO_1832_NOSE_RADII,
  ISO_1832_SHAPES,
  ISO_1832_SIZES,
  ISO_1832_THICKNESSES,
  ISO_1832_TOLERANCES,
} from './iso-1832.static-data';
import type { InsertCodeDecoding, InsertCodeError } from './models/insert-code.model';

const codesOf = (decoding: InsertCodeDecoding): readonly string[] =>
  decoding.ok ? decoding.positions.map(({ code }) => code) : [];

const recomposed = (decoding: InsertCodeDecoding): string =>
  decoding.ok ? `${codesOf(decoding).join('')}${decoding.suffix}` : '';

const errorOf = (decoding: InsertCodeDecoding): InsertCodeError | undefined =>
  decoding.ok ? undefined : decoding.error;

describe('normalizeInsertCode', () => {
  it.each([
    ['cnmg 120408', 'CNMG120408'],
    ['  CNMG-120408-pm ', 'CNMG120408PM'],
    ['ccgt\t09t304', 'CCGT09T304'],
    ['', ''],
  ])('Given %j When normalized Then it reads %j', (raw, normalized) => {
    expect(normalizeInsertCode(raw)).toBe(normalized);
  });
});

describe('decodeInsertCode', () => {
  it('Given CNMG 120408 When decoded Then each position gives its label, code, meaning and both concordant sources', () => {
    const decoding = decodeInsertCode('CNMG 120408');

    expect(
      decoding.ok &&
        decoding.positions.map(({ position, label, code, meaning, sources }) => [
          position,
          label,
          code,
          meaning,
          sources.map(({ publisher }) => publisher),
        ]),
    ).toEqual([
      [1, 'Forme', 'C', 'Losange 80°', ['Mitsubishi Materials', 'Kyocera']],
      [2, 'Dépouille', 'N', 'Dépouille 0°', ['Mitsubishi Materials', 'Kyocera']],
      [
        3,
        'Tolérance',
        'M',
        'Classe M\u00a0: hauteur de bec ±0,08 à ±0,18\u00a0mm, cercle inscrit ±0,05 à ±0,15\u00a0mm, épaisseur ±0,13\u00a0mm, périphérie brute de frittage',
        ['Mitsubishi Materials', 'Kyocera'],
      ],
      [
        4,
        'Fixation et brise-copeaux',
        'G',
        'Trou cylindrique, brise-copeaux deux faces',
        ['Mitsubishi Materials', 'Kyocera'],
      ],
      [
        5,
        'Taille',
        '12',
        'Arête de 12\u00a0mm (cercle inscrit 12,70\u00a0mm)',
        ['Mitsubishi Materials', 'Mitsubishi Materials', 'Kyocera'],
      ],
      [6, 'Épaisseur', '04', 'Épaisseur 4,76\u00a0mm', ['Mitsubishi Materials', 'Kyocera']],
      [7, 'Rayon de bec', '08', 'Rayon de bec 0,8\u00a0mm', ['Mitsubishi Materials', 'Kyocera']],
    ]);
  });

  it.each([
    ['CNMG 120408', ['C', 'N', 'M', 'G', '12', '04', '08']],
    ['DNMG 150608', ['D', 'N', 'M', 'G', '15', '06', '08']],
    ['VBMT 160404', ['V', 'B', 'M', 'T', '16', '04', '04']],
    ['CCGT 09T304', ['C', 'C', 'G', 'T', '09', 'T3', '04']],
    ['TNMG 160408', ['T', 'N', 'M', 'G', '16', '04', '08']],
    ['SNMG 120408', ['S', 'N', 'M', 'G', '12', '04', '08']],
    ['WNMG 080408', ['W', 'N', 'M', 'G', '08', '04', '08']],
  ])(
    'Given the common code %s When decoded Then its seven positions are recognised, without suffix',
    (raw, codes) => {
      const decoding = decodeInsertCode(raw);

      expect([decoding.ok, codesOf(decoding), decoding.ok && decoding.suffix]).toEqual([
        true,
        codes,
        '',
      ]);
    },
  );

  it.each([
    ['VBMT 160404', 4, 'Arête de 16\u00a0mm (cercle inscrit 9,525\u00a0mm)'],
    ['WNMG 080408', 4, 'Arête de 8\u00a0mm (cercle inscrit 12,70\u00a0mm)'],
    ['CCGT 09T304', 5, 'Épaisseur 3,97\u00a0mm'],
    ['VBMT 160404', 1, 'Dépouille 5°'],
    ['ENMG 160408', 4, 'Arête de 16\u00a0mm'],
  ])('Given %s When decoded Then position %i means %j', (raw, index, meaning) => {
    const decoding = decodeInsertCode(raw);

    expect(decoding.ok && decoding.positions[index].meaning).toBe(meaning);
  });

  it.each([
    ['cnmg120408', 'CNMG120408', ''],
    [' CNMG-120408 ', 'CNMG120408', ''],
    ['CNMG 120408-PM', 'CNMG120408PM', 'PM'],
    ['ccgt 09t304 mer-u', 'CCGT09T304MERU', 'MERU'],
  ])(
    'Given %j When decoded Then case, spaces and dashes are tolerated and what follows position 7 is the maker suffix',
    (raw, normalized, suffix) => {
      const decoding = decodeInsertCode(raw);

      expect([recomposed(decoding), decoding.ok && decoding.suffix]).toEqual([normalized, suffix]);
    },
  );

  it.each<[string, InsertCodeError]>([
    ['', { position: 1, reason: 'missing', found: '' }],
    ['   ', { position: 1, reason: 'missing', found: '' }],
    ['XNMG 120408', { position: 1, reason: 'unknown', found: 'X' }],
    ['CONMG 120408', { position: 2, reason: 'unknown', found: 'O' }],
    ['CXMG 120408', { position: 2, reason: 'unknown', found: 'X' }],
    ['CNPG 120408', { position: 3, reason: 'unknown', found: 'P' }],
    ['CNM', { position: 4, reason: 'missing', found: '' }],
    ['CNMZ 120408', { position: 4, reason: 'unknown', found: 'Z' }],
    ['CNMG', { position: 5, reason: 'missing', found: '' }],
    ['CNMG 990408', { position: 5, reason: 'unknown', found: '99' }],
    ['CNMG 080408', { position: 5, reason: 'unknown', found: '08' }],
    ['ENMG 000408', { position: 5, reason: 'unknown', found: '00' }],
    ['RCMT 1204M0', { position: 5, reason: 'unknown', found: '12' }],
    ['CNMG 1', { position: 5, reason: 'missing', found: '1' }],
    ['CNMG 12', { position: 6, reason: 'missing', found: '' }],
    ['CNMG 12S108', { position: 6, reason: 'unknown', found: 'S1' }],
    ['CNMG 120508', { position: 6, reason: 'unknown', found: '05' }],
    ['CNMG 1204', { position: 7, reason: 'missing', found: '' }],
    ['CNMG 12040', { position: 7, reason: 'missing', found: '0' }],
    ['CNMG 1204V3', { position: 7, reason: 'unknown', found: 'V3' }],
    ['CNMG 120403', { position: 7, reason: 'unknown', found: '03' }],
  ])('Given %j When decoded Then the error points at the faulty position', (raw, error) => {
    expect(errorOf(decodeInsertCode(raw))).toEqual(error);
  });

  it.each<[string, InsertCodeError]>([
    ['CNMG 432', { position: 5, reason: 'ansi', found: '432' }],
    ['cnmg 432-pm', { position: 5, reason: 'ansi', found: '432' }],
    ['DNMG 442', { position: 5, reason: 'ansi', found: '442' }],
    ['CCGT 32.51', { position: 5, reason: 'ansi', found: '32.51' }],
    ['TPG 322', { position: 4, reason: 'ansi', found: '322' }],
  ])(
    'Given the inch code %j When decoded Then it is refused as ANSI, never decoded',
    (raw, error) => {
      expect(errorOf(decodeInsertCode(raw))).toEqual(error);
    },
  );

  describe('property: decoding then recomposing gives back the normalized code', () => {
    const BASE = {
      shape: 'C',
      clearance: 'N',
      tolerance: 'M',
      fixing: 'G',
      size: '12',
      thickness: '04',
      radius: '08',
    };
    type Parts = typeof BASE;
    const compose = (parts: Parts): string =>
      `${parts.shape}${parts.clearance}${parts.tolerance}${parts.fixing}${parts.size}${parts.thickness}${parts.radius}`;
    const SIZED_SHAPES = Object.entries(ISO_1832_SIZES.inscribedCircles).flatMap(([shape, sizes]) =>
      Object.keys(sizes).map((size) => ({ ...BASE, shape, size })),
    );
    const UNSIZED_SHAPES = Object.keys(ISO_1832_SHAPES.entries)
      .filter((shape) => !(shape in ISO_1832_SIZES.inscribedCircles) && shape !== 'R')
      .flatMap((shape) => ['01', '09', '16', '99'].map((size) => ({ ...BASE, shape, size })));
    const EVERY_ENTRY: readonly Parts[] = [
      ...SIZED_SHAPES,
      ...UNSIZED_SHAPES,
      ...Object.keys(ISO_1832_CLEARANCES.entries).map((clearance) => ({ ...BASE, clearance })),
      ...Object.keys(ISO_1832_TOLERANCES.entries).map((tolerance) => ({ ...BASE, tolerance })),
      ...Object.keys(ISO_1832_FIXINGS.entries).map((fixing) => ({ ...BASE, fixing })),
      ...Object.keys(ISO_1832_THICKNESSES.entries).map((thickness) => ({ ...BASE, thickness })),
      ...Object.keys(ISO_1832_NOSE_RADII.entries).map((radius) => ({ ...BASE, radius })),
    ];
    const FORMATS: readonly ((code: string) => string)[] = [
      (code): string => code,
      (code): string => code.toLowerCase(),
      (code): string => ` ${code.slice(0, 4)} ${code.slice(4)} `,
      (code): string => `${code.slice(0, 4)}-${code.slice(4)}-pm`,
    ];

    it('Given every entry of the table, in every accepted spelling When decoded Then recomposing the positions and the suffix gives the normalized code', () => {
      const mismatches = EVERY_ENTRY.flatMap((parts) =>
        FORMATS.map((format) => format(compose(parts))).filter(
          (raw) => recomposed(decodeInsertCode(raw)) !== normalizeInsertCode(raw),
        ),
      );

      expect([EVERY_ENTRY.length, mismatches]).toEqual([36 + 40 + 9 + 12 + 15 + 9 + 11, []]);
    });

    it('Given every entry of the table When decoded Then each position code is the one written, in the table order', () => {
      const wrong = EVERY_ENTRY.filter((parts) => {
        const decoding = decodeInsertCode(compose(parts));
        return (
          codesOf(decoding).join('|') !==
          [
            parts.shape,
            parts.clearance,
            parts.tolerance,
            parts.fixing,
            parts.size,
            parts.thickness,
            parts.radius,
          ].join('|')
        );
      });

      expect(wrong).toEqual([]);
    });
  });
});

describe('textAfterInsertCode', () => {
  it.each<[string, string, string | undefined]>([
    ['a bare code', 'CNMG 120408', ''],
    ['a maker suffix', 'CNMG 120408-PM', '-PM'],
    ['a typed work order', 'CNMG 120408 OF n° 4521', ' OF n° 4521'],
    ['spaces inside the code', 'cnmg 12 04 08 12345', ' 12345'],
    ['a code that does not decode', 'CODE 123456', undefined],
  ])('Given %s When the text after the code is read Then it is kept as typed', (_, raw, after) => {
    expect(textAfterInsertCode(raw)).toBe(after);
  });
});
