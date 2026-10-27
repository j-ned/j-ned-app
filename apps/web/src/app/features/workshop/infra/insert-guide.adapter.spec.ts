import { describe, expect, it } from 'vitest';
import { toInsertGuide } from './insert-guide.adapter';
import type { InsertGuideDto } from './insert-guide.types';

const A_DTO: InsertGuideDto = {
  enabled: true,
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
  it('Given the API document When it is adapted Then the guide keeps the switch and the entries, without the storage fields', () => {
    expect(toInsertGuide(A_DTO)).toEqual({
      enabled: true,
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

  it('Given no document yet When it is adapted Then the guide is off and empty', () => {
    expect(toInsertGuide({ enabled: false, entries: [], version: 0, updatedAt: null })).toEqual({
      enabled: false,
      entries: [],
    });
  });
});
