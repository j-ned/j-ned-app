import type { InsertGuideReference } from './models/insert-guide-reference.model';

export type GuideSelection = { readonly material: string; readonly operation: string };

const knownSlug = (raw: string | undefined, slugs: readonly string[]): string =>
  raw !== undefined && slugs.includes(raw) ? raw : '';

export function parseGuideSelection(
  reference: InsertGuideReference,
  rawMaterial: string | undefined,
  rawOperation: string | undefined,
): GuideSelection {
  return {
    material: knownSlug(
      rawMaterial,
      reference.materials.map(({ slug }) => slug),
    ),
    operation: knownSlug(
      rawOperation,
      reference.families.flatMap(({ operations }) => operations.map(({ slug }) => slug)),
    ),
  };
}
