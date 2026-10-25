import type { OperationFamily } from './models/operation.model';

export const OPERATION_FAMILIES: readonly OperationFamily[] = [
  {
    id: 'external-turning',
    label: 'Tournage extérieur',
    operations: [
      { id: 'external-roughing', slug: 'ebauche-exterieure', label: 'Ébauche' },
      { id: 'external-semi-finishing', slug: 'semi-finition-exterieure', label: 'Semi-finition' },
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
];
