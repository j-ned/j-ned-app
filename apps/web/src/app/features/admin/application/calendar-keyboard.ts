const DAY_MS = 86_400_000;

const toUtc = (date: string): Date => new Date(`${date}T00:00:00Z`);

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (date: string, days: number): string =>
  toDateKey(new Date(toUtc(date).getTime() + days * DAY_MS));

const isoWeekday = (date: string): number => toUtc(date).getUTCDay() || 7;

function addMonthsBounded(date: string, months: number): string {
  const source = toUtc(date);
  const year = source.getUTCFullYear();
  const month = source.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return toDateKey(new Date(Date.UTC(year, month, Math.min(source.getUTCDate(), lastDay))));
}

export function nextCalendarDate(date: string, key: string): string | null {
  switch (key) {
    case 'ArrowRight':
      return addDays(date, 1);
    case 'ArrowLeft':
      return addDays(date, -1);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'Home':
      return addDays(date, 1 - isoWeekday(date));
    case 'End':
      return addDays(date, 7 - isoWeekday(date));
    case 'PageDown':
      return addMonthsBounded(date, 1);
    case 'PageUp':
      return addMonthsBounded(date, -1);
    default:
      return null;
  }
}
