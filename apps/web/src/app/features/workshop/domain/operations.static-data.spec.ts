import { describe, expect, expectTypeOf, it } from 'vitest';
import type { OperationFamily } from './models/operation.model';
import { OPERATION_FAMILIES } from './operations.static-data';

describe('OPERATION_FAMILIES', () => {
  it('Given the guide When its families are read Then their type is the operation family model', () => {
    expectTypeOf(OPERATION_FAMILIES).toEqualTypeOf<readonly OperationFamily[]>();
  });

  it('Given the guide When its families are read Then they list every operation once, in order, with a frozen URL slug', () => {
    expect(OPERATION_FAMILIES).toEqual([
      {
        id: 'external-turning',
        label: 'Tournage extérieur',
        operations: [
          { id: 'external-roughing', slug: 'ebauche-exterieure', label: 'Ébauche' },
          {
            id: 'external-semi-finishing',
            slug: 'semi-finition-exterieure',
            label: 'Semi-finition',
          },
          { id: 'external-finishing', slug: 'finition-exterieure', label: 'Finition' },
        ],
      },
      {
        id: 'internal-turning',
        label: 'Intérieur (alésage)',
        operations: [
          { id: 'internal-roughing', slug: 'ebauche-interieure', label: 'Ébauche' },
          { id: 'internal-finishing', slug: 'finition-interieure', label: 'Finition' },
        ],
      },
      {
        id: 'grooving-parting',
        label: 'Gorge et tronçonnage',
        operations: [
          { id: 'grooving', slug: 'gorge', label: 'Gorge' },
          { id: 'parting-off', slug: 'tronconnage', label: 'Tronçonnage' },
        ],
      },
      {
        id: 'threading',
        label: 'Filetage',
        operations: [{ id: 'threading', slug: 'filetage', label: 'Filetage' }],
      },
      {
        id: 'drilling',
        label: 'Perçage',
        operations: [
          { id: 'insert-drilling', slug: 'percage', label: 'Perçage au foret à plaquettes' },
        ],
      },
    ]);
  });
});
