import type { InsertGuideEntry } from '../domain/models/insert-guide.model';

export const anEntry = (overrides: Partial<InsertGuideEntry> = {}): InsertGuideEntry => ({
  material: 'Matière fictive',
  operation: 'external-roughing',
  insert: 'CODE-FICTIF-01',
  noseRadius: 0.8,
  ...overrides,
});
