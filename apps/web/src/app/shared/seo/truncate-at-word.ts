/** Coupe un texte pour une meta description sans finir au milieu d'un mot. */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const endsOnBoundary = /[\s,;:.!?]/.test(text.charAt(max - 1));
  const lastSpace = cut.lastIndexOf(' ');
  const base = endsOnBoundary || lastSpace <= max / 2 ? cut : cut.slice(0, lastSpace);
  return `${base.replace(/[\s,;:]+$/, '')}…`;
}
