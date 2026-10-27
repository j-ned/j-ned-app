import { describe, expect, it } from 'vitest';
import { MACHINING_OPERATIONS } from './machining-operations.static-data';

describe('MACHINING_OPERATIONS', () => {
  it('Given the closed list of operations When it is read Then each operation carries its French label, in the order of the spec', () => {
    expect(MACHINING_OPERATIONS).toEqual([
      { id: 'external-roughing', label: 'Ébauche extérieure' },
      { id: 'external-finishing', label: 'Finition extérieure' },
      { id: 'internal-roughing', label: 'Ébauche intérieure' },
      { id: 'internal-finishing', label: 'Finition intérieure' },
      { id: 'drilling', label: 'Perçage' },
      { id: 'grooving', label: 'Gorge' },
      { id: 'parting-off', label: 'Tronçonnage' },
      { id: 'threading', label: 'Filetage' },
    ]);
  });
});
