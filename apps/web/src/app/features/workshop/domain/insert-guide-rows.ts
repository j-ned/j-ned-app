import { MACHINING_OPERATIONS } from './machining-operations.static-data';
import type { InsertGuideEntry, InsertGuideRow } from './models/insert-guide.model';

const operationRank = (entry: InsertGuideEntry): number =>
  MACHINING_OPERATIONS.findIndex(({ id }) => id === entry.operation);

const operationLabel = (entry: InsertGuideEntry): string =>
  MACHINING_OPERATIONS.find(({ id }) => id === entry.operation)?.label ?? entry.operation;

export function materialsOf(entries: readonly InsertGuideEntry[]): readonly string[] {
  const materials = entries.flatMap(({ material, allMaterials }) =>
    allMaterials || material === undefined ? [] : [material],
  );
  return [...new Set(materials)].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function rowsFor(
  entries: readonly InsertGuideEntry[],
  material: string,
): readonly InsertGuideRow[] {
  return entries
    .filter((entry) => entry.allMaterials || entry.material === material)
    .sort((a, b) => operationRank(a) - operationRank(b))
    .map((entry) => ({
      operation: operationLabel(entry),
      insert: entry.insert,
      ...(entry.noseRadius === undefined ? {} : { noseRadius: entry.noseRadius }),
      ...(entry.note === undefined ? {} : { note: entry.note }),
      allMaterials: entry.allMaterials === true,
    }));
}
