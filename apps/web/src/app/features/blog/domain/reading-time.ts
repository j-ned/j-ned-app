// Vitesse retenue pour un texte technique en français.
const WORDS_PER_MINUTE = 220;

// Même découpage que l'API (`apps/api/src/blog/word-count.ts`) : l'aperçu de l'éditeur doit tomber juste.
export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
