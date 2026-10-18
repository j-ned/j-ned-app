import { normalizeTag, tagKey } from './tag-key';

/** Catalogue et tags déjà posés sur les contenus, sans doublon (graphie du catalogue d'abord), triés. */
export function knownTags(
  catalogue: readonly string[],
  used: readonly (readonly string[])[],
): readonly string[] {
  const byKey = new Map<string, string>();
  for (const tag of [...catalogue, ...used.flat()]) {
    const key = tagKey(tag);
    if (key !== '' && !byKey.has(key)) byKey.set(key, normalizeTag(tag));
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

// Recherche insensible à la casse et aux accents : « secu » trouve « Sécurité ».
const fold = (text: string): string =>
  tagKey(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/** Tags connus non sélectionnés contenant la saisie, ceux qui commencent par elle en premier. */
export function matchingTags(
  known: readonly string[],
  selected: readonly string[],
  query: string,
): readonly string[] {
  const taken = new Set(selected.map(tagKey));
  const candidates = known.filter((tag) => !taken.has(tagKey(tag)));
  const needle = fold(query);
  if (needle === '') return candidates;
  const starting = candidates.filter((tag) => fold(tag).startsWith(needle));
  const containing = candidates.filter(
    (tag) => !fold(tag).startsWith(needle) && fold(tag).includes(needle),
  );
  return [...starting, ...containing];
}
