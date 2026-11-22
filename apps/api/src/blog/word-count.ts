// Même découpage que `apps/web/src/app/features/blog/domain/reading-time.ts` : le site en tire le
// temps de lecture des listes, qui ne joignent pas le corps.
export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}
