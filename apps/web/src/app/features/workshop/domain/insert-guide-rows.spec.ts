import { describe, expect, it } from 'vitest';
import { aGenericEntry, anEntry } from '../testing/insert-guide-builders';
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

  it('Given lines for all materials When the materials are listed Then they add no material', () => {
    expect(
      materialsOf([aGenericEntry(), anEntry({ material: 'Inox fictif' }), aGenericEntry()]),
    ).toEqual(['Inox fictif']);
  });

  it('Given only lines for all materials When the materials are listed Then the list is empty', () => {
    expect(materialsOf([aGenericEntry(), aGenericEntry({ insert: 'BARRE-FICTIVE-02' })])).toEqual(
      [],
    );
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
        allMaterials: false,
        key: 2,
      },
      {
        operation: 'Ébauche extérieure',
        insert: 'EBA-2',
        noseRadius: 0.8,
        allMaterials: false,
        key: 4,
      },
      { operation: 'Gorge', insert: 'GOR-1', noseRadius: 0.4, allMaterials: false, key: 3 },
      { operation: 'Filetage', insert: 'FIL-1', noseRadius: 0.2, allMaterials: false, key: 0 },
    ]);
  });

  it.each([
    ['Acier fictif', 'EBA-1', 'FIL-1', 3, 0],
    ['Laiton fictif', 'EBA-2', 'FIL-2', 4, 1],
  ])(
    'Given a line for all materials When the rows of « %s » are read Then it comes among its own, at the rank of its operation, without a radius',
    (material, roughing, threading, roughingKey, threadingKey) => {
      const withGeneric = [
        anEntry({ material: 'Acier fictif', operation: 'threading', insert: 'FIL-1' }),
        anEntry({ material: 'Laiton fictif', operation: 'threading', insert: 'FIL-2' }),
        aGenericEntry({ note: 'Diamètre au besoin.' }),
        anEntry({ material: 'Acier fictif', operation: 'external-roughing', insert: 'EBA-1' }),
        anEntry({ material: 'Laiton fictif', operation: 'external-roughing', insert: 'EBA-2' }),
      ];

      expect(rowsFor(withGeneric, material)).toEqual([
        {
          operation: 'Ébauche extérieure',
          insert: roughing,
          noseRadius: 0.8,
          allMaterials: false,
          key: roughingKey,
        },
        {
          operation: 'Alésage (ébauche et finition)',
          insert: 'BARRE-FICTIVE-01',
          note: 'Diamètre au besoin.',
          allMaterials: true,
          key: 2,
        },
        {
          operation: 'Filetage',
          insert: threading,
          noseRadius: 0.8,
          allMaterials: false,
          key: threadingKey,
        },
      ]);
    },
  );

  it('Given two lines for all materials alike but for their note When the rows are read Then each keeps its own place in the guide as key, in the guide order', () => {
    const twins = [
      anEntry({ material: 'Acier fictif', insert: 'EBA-1' }),
      aGenericEntry({ note: 'Petit diamètre.' }),
      aGenericEntry({ note: 'Grand diamètre.' }),
    ];

    expect(rowsFor(twins, 'Acier fictif').map(({ key, note }) => ({ key, note }))).toEqual([
      { key: 0, note: undefined },
      { key: 1, note: 'Petit diamètre.' },
      { key: 2, note: 'Grand diamètre.' },
    ]);
  });

  it.each(['', 'Matière inconnue', 'acier fictif'])(
    'Given the material « %s » absent from the guide When its rows are read Then there is none',
    (material) => {
      expect(rowsFor(entries, material)).toEqual([]);
    },
  );
});
