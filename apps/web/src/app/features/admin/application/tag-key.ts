/** Saisie d'un tag nettoyée : espaces de bord retirés, espaces internes réduits à un seul. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Clé de comparaison de deux tags : la casse ne les distingue pas. */
export function tagKey(tag: string): string {
  return normalizeTag(tag).toLocaleLowerCase('fr');
}
