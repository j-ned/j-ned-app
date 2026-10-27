import { describe, expect, it } from 'vitest';
import { toInsertGuide, toInsertGuideDocument } from './insert-guide.adapter';
import type { InsertGuideDto } from './insert-guide.types';

const A_DTO: InsertGuideDto = {
  enabled: true,
  decoderEnabled: true,
  entries: [
    {
      material: 'Matière fictive',
      operation: 'grooving',
      insert: 'CODE-FICTIF-01',
      noseRadius: 0.4,
      note: 'Remarque fictive.',
    },
    {
      material: 'Matière fictive',
      operation: 'drilling',
      insert: 'CODE-FICTIF-02',
      noseRadius: 0.8,
    },
  ],
  version: 3,
  updatedAt: '2026-10-26T10:00:00.000Z',
};

describe('toInsertGuide', () => {
  it('Given the API document When it is adapted Then the guide keeps both switches and the entries, without the storage fields', () => {
    expect(toInsertGuide(A_DTO)).toEqual({
      enabled: true,
      decoderEnabled: true,
      entries: [
        {
          material: 'Matière fictive',
          operation: 'grooving',
          insert: 'CODE-FICTIF-01',
          noseRadius: 0.4,
          note: 'Remarque fictive.',
        },
        {
          material: 'Matière fictive',
          operation: 'drilling',
          insert: 'CODE-FICTIF-02',
          noseRadius: 0.8,
        },
      ],
    });
  });

  it('Given no document yet When it is adapted Then the guide and the decoder are off, the guide empty', () => {
    expect(
      toInsertGuide({
        enabled: false,
        decoderEnabled: false,
        entries: [],
        version: 0,
        updatedAt: null,
      }),
    ).toEqual({ enabled: false, decoderEnabled: false, entries: [] });
  });

  it.each([
    [true, false],
    [false, true],
  ])(
    'Given the guide switch read as %s and the decoder switch as %s When it is adapted Then each switch keeps its own value',
    (enabled, decoderEnabled) => {
      const { enabled: guide, decoderEnabled: decoder } = toInsertGuide({
        ...A_DTO,
        enabled,
        decoderEnabled,
      });

      expect([guide, decoder]).toEqual([enabled, decoderEnabled]);
    },
  );
});

describe('toInsertGuide, lines for all materials', () => {
  it.each<[string, InsertGuideDto['entries'][number]]>([
    [
      'without material nor radius',
      {
        allMaterials: true,
        operation: 'boring',
        insert: 'BARRE-FICTIVE-01',
        note: 'Remarque fictive.',
      },
    ],
    [
      'with a blank material and a null radius',
      {
        allMaterials: true,
        material: '',
        operation: 'boring',
        insert: 'BARRE-FICTIVE-01',
        noseRadius: null,
        note: 'Remarque fictive.',
      },
    ],
  ])(
    'Given a line for all materials %s When it is adapted Then it is flagged, without material nor radius',
    (_case, entry) => {
      expect(toInsertGuide({ ...A_DTO, entries: [entry] }).entries).toEqual([
        {
          allMaterials: true,
          operation: 'boring',
          insert: 'BARRE-FICTIVE-01',
          note: 'Remarque fictive.',
        },
      ]);
    },
  );

  it('Given a line of one material without radius When it is adapted Then it keeps its material, without radius nor flag', () => {
    expect(
      toInsertGuide({
        ...A_DTO,
        entries: [
          {
            material: 'Matière fictive',
            operation: 'boring',
            insert: 'BARRE-FICTIVE-01',
            noseRadius: null,
          },
        ],
      }).entries,
    ).toEqual([{ material: 'Matière fictive', operation: 'boring', insert: 'BARRE-FICTIVE-01' }]);
  });
});

describe('toInsertGuideDocument', () => {
  it('Given the API document When it is adapted for the admin Then the guide keeps its version, without the date', () => {
    expect(toInsertGuideDocument(A_DTO)).toEqual({ ...toInsertGuide(A_DTO), version: 3 });
  });
});
