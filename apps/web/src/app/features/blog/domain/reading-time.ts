/** Vitesse de lecture retenue pour un texte technique en français (mots par minute). */
const WORDS_PER_MINUTE = 220;

/**
 * Nombre de mots d'un Markdown, même découpage que l'API (`apps/api/src/blog/word-count.ts`) : sert à
 * l'aperçu de l'éditeur, dont le corps n'est pas encore enregistré.
 */
export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

/** Temps de lecture estimé d'un article, en minutes entières (au moins 1). */
export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
