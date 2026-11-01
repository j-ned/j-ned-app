const NNBSP = '\u202f';
const GROUPED = new Intl.NumberFormat('fr-FR');

// Le séparateur de milliers d'Intl varie selon l'ICU : l'espace fine insécable est posée ici.
export function groupedNumber(value: number): string {
  return GROUPED.format(value).replace(/\s/g, NNBSP);
}
