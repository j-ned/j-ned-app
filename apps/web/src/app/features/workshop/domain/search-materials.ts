import type { Material, MaterialSuggestion } from './models/material.model';
import { normalizeDesignation } from './normalize-designation';

export function searchMaterials(
  materials: readonly Material[],
  query: string,
): readonly MaterialSuggestion[] {
  const needle = normalizeDesignation(query);
  if (needle === '')
    return materials.map((material) => ({ material, matched: material.designations[0] }));

  const suggest = (matches: (designation: string) => boolean): readonly MaterialSuggestion[] =>
    materials.flatMap((material) => {
      const matched = material.designations.find(({ value }) =>
        matches(normalizeDesignation(value)),
      );
      return matched ? [{ material, matched }] : [];
    });

  const starting = suggest((designation) => designation.startsWith(needle));
  const startingMaterials = new Set(starting.map(({ material }) => material));
  const containing = suggest((designation) => designation.includes(needle)).filter(
    ({ material }) => !startingMaterials.has(material),
  );
  return [...starting, ...containing];
}
