/**
 * Nombre de mots d'un article Markdown. Les listes publiques ne joignent pas le corps : le site en
 * tire le temps de lecture (`apps/web/src/app/features/blog/domain/reading-time.ts`, même découpage).
 */
export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}
