import type { MachiningOperation } from './models/insert-guide.model';

export const MACHINING_OPERATIONS: readonly {
  readonly id: MachiningOperation;
  readonly label: string;
}[] = [
  { id: 'external-roughing', label: 'Ébauche extérieure' },
  { id: 'external-finishing', label: 'Finition extérieure' },
  { id: 'internal-roughing', label: 'Ébauche intérieure' },
  { id: 'internal-finishing', label: 'Finition intérieure' },
  { id: 'boring', label: 'Alésage (ébauche et finition)' },
  { id: 'drilling', label: 'Perçage' },
  { id: 'grooving', label: 'Gorge' },
  { id: 'parting-off', label: 'Tronçonnage' },
  { id: 'threading', label: 'Filetage' },
];
