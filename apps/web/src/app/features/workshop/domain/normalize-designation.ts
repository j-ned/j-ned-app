export function normalizeDesignation(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[\s\u2010\u2013-]/gu, '');
}
