export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function tagKey(tag: string): string {
  return normalizeTag(tag).toLocaleLowerCase('fr');
}
