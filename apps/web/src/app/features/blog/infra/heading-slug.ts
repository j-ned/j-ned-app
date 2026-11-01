/**
 * Slug ASCII d'un titre d'article, pour les ancres `#id` (même convention que les slugs d'URL
 * de l'API : accents retirés, tout ce qui n'est pas alphanumérique devient un tiret).
 */
export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
