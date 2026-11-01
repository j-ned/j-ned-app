// Intl écrit « 1 octobre » ; l'usage français veut « 1er octobre ».
export function withFirstOfMonth(format: Intl.DateTimeFormat, date: Date): string {
  return format
    .formatToParts(date)
    .map((part) => (part.type === 'day' && part.value === '1' ? '1er' : part.value))
    .join('');
}
