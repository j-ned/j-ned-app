import type {
  CalendarDay,
  CalendarMonth,
} from '@features/booking/domain/models/booking-admin.model';
import { aCalendarDay, aCalendarMonth } from '@features/booking/testing/booking-builders';

type CalendarMonthOverrides = Partial<Omit<CalendarMonth, 'month' | 'days'>> & {
  readonly days?: Readonly<Record<string, Partial<CalendarDay>>>;
};

export function datesOfMonth(month: string): readonly string[] {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const length = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length }, (_, offset) => `${month}-${String(offset + 1).padStart(2, '0')}`);
}

// Jours ouverts à 4 créneaux par défaut, ceux d'avant `today` passés, comme les rend le serveur.
export function aCalendarMonthOf(
  month: string,
  { days = {}, ...overrides }: CalendarMonthOverrides = {},
): CalendarMonth {
  const base = aCalendarMonth({ month, ...overrides });
  return {
    ...base,
    days: datesOfMonth(month).map((date) =>
      aCalendarDay({ date, ...(date < base.today ? { state: 'past' } : {}), ...days[date] }),
    ),
  };
}
