import type { BookingDay, BookingWeek } from './models/booking.model';
import { formatWeekLabel } from './paris-format';

const DAY_MS = 86_400_000;

function isoMondayOf(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - daysSinceMonday * DAY_MS).toISOString().slice(0, 10);
}

export function groupDaysByWeek(days: readonly BookingDay[]): readonly BookingWeek[] {
  const daysByMonday = new Map<string, readonly BookingDay[]>();
  for (const day of days) {
    const monday = isoMondayOf(day.date);
    daysByMonday.set(monday, [...(daysByMonday.get(monday) ?? []), day]);
  }
  return Array.from(daysByMonday, ([key, weekDays]) => ({
    key,
    label: formatWeekLabel(key),
    days: weekDays,
  }));
}
