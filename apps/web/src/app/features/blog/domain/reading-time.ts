/** Vitesse de lecture retenue pour un texte technique en français (mots par minute). */
const WORDS_PER_MINUTE = 220;

/** Temps de lecture estimé d'un article Markdown, en minutes entières (au moins 1). */
export function readingTimeMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
