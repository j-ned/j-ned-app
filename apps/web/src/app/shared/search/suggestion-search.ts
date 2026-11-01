/** Clé de recherche : « Inox-316 L » et « inox316l » se valent. */
export function suggestionKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\s-]+/gu, '')
    .toLowerCase();
}

export function matchingSuggestions(
  suggestions: readonly string[],
  query: string,
): readonly string[] {
  const needle = suggestionKey(query);
  if (needle === '') return suggestions;
  const keyed = suggestions.map((text) => ({ text, key: suggestionKey(text) }));
  const starting = keyed.filter(({ key }) => key.startsWith(needle));
  const containing = keyed.filter(({ key }) => !key.startsWith(needle) && key.includes(needle));
  return [...starting, ...containing].map(({ text }) => text);
}

export function distinctSuggestions(values: readonly string[]): readonly string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const key = suggestionKey(value);
    if (key !== '' && !byKey.has(key)) byKey.set(key, value.trim());
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}
