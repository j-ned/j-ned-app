import { describe, expect, it } from 'vitest';
import { anEntry } from '../testing/insert-guide-builders';
import { materialsOf, rowsFor } from './insert-guide-rows';

describe('materialsOf', () => {
  it('Given entries sharing materials When the materials are listed Then each one appears once, in French alphabetical order', () => {
    const entries = [
      anEntry({ material: 'Laiton fictif' }),
      anEntry({ material: 'Acier fictif', operation: 'drilling' }),
      anEntry({ material: 'Écrou fictif' }),
      anEntry({ material: 'Acier fictif', operation: 'threading' }),
      anEntry({ material: 'Inox fictif' }),
    ];

    expect(materialsOf(entries)).toEqual([
      'Acier fictif',
      'Écrou fictif',
      'Inox fictif',
      'Laiton fictif',
    ]);
  });

  it('Given no entry When the materials are listed Then the list is empty', () => {
    expect(materialsOf([])).toEqual([]);
  });
});

describe('rowsFor', () => {
  const entries = [
    anEntry({ material: 'Acier fictif', operation: 'threading', insert: 'FIL-1', noseRadius: 0.2 }),
    anEntry({ material: 'Laiton fictif', operation: 'external-roughing', insert: 'LAI-1' }),
    anEntry({
      material: 'Acier fictif',
      operation: 'external-roughing',
      insert: 'EBA-1',
      noseRadius: 1.2,
      note: 'Remarque fictive.',
    }),
    anEntry({ material: 'Acier fictif', operation: 'grooving', insert: 'GOR-1', noseRadius: 0.4 }),
    anEntry({ material: 'Acier fictif', operation: 'external-roughing', insert: 'EBA-2' }),
  ];

  it('Given a material When its rows are read Then only its entries come, in the order of the operations list, with the French label', () => {
    expect(rowsFor(entries, 'Acier fictif')).toEqual([
      {
        operation: 'Ébauche extérieure',
        insert: 'EBA-1',
        noseRadius: 1.2,
        note: 'Remarque fictive.',
      },
      { operation: 'Ébauche extérieure', insert: 'EBA-2', noseRadius: 0.8 },
      { operation: 'Gorge', insert: 'GOR-1', noseRadius: 0.4 },
      { operation: 'Filetage', insert: 'FIL-1', noseRadius: 0.2 },
    ]);
  });

  it.each(['', 'Matière inconnue', 'acier fictif'])(
    'Given the material « %s » absent from the guide When its rows are read Then there is none',
    (material) => {
      expect(rowsFor(entries, material)).toEqual([]);
    },
  );
});
