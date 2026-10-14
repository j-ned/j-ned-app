import type {
  CalendarDay,
  CalendarDayState,
  CalendarMonth,
} from '@features/booking/domain/models/booking-admin.model';
import { formatLongDate, formatMonthLabel } from '@features/booking/domain/paris-format';
import { capitalize } from './capitalize';

export type CalendarCell = {
  readonly date: string;
  readonly dayOfMonth: number;
  readonly state: CalendarDayState;
  readonly today: boolean;
  readonly actionable: boolean;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: 'lock' | 'flag' | 'calendar' | null;
  readonly reopenedHoliday: boolean;
};

export type CalendarMonthView = {
  readonly month: string;
  readonly label: string;
  readonly previousMonth: string | null;
  readonly nextMonth: string | null;
  readonly closePublicHolidays: boolean;
  readonly weeks: readonly (readonly (CalendarCell | null)[])[];
};

export type BookingWarning = { readonly date: string; readonly count: number };

const DAYS_PER_WEEK = 7;

const ICONS: Readonly<Partial<Record<CalendarDayState, CalendarCell['icon']>>> = {
  closed: 'lock',
  holiday: 'flag',
  'closed-period': 'calendar',
};

const slots = (count: number): string => `${count} ${count === 1 ? 'créneau' : 'créneaux'}`;

function status(day: CalendarDay): string {
  const holiday = day.holiday === null ? '' : `férié (${day.holiday})`;
  switch (day.state) {
    case 'past':
      return 'passé';
    case 'closed-period': {
      const closure = day.closure;
      if (closure === null) return 'fermé par une période';
      const period = `fermé par la période du ${formatLongDate(closure.startsOn)} au ${formatLongDate(closure.endsOn)}`;
      return closure.reason === null ? period : `${period} (${closure.reason})`;
    }
    case 'closed':
    case 'holiday':
      return holiday === '' ? 'fermé' : `${holiday}, fermé`;
    case 'open':
      return holiday === ''
        ? `ouvert, ${slots(day.slotCount)}`
        : `${holiday} rouvert, ${slots(day.slotCount)}`;
    case 'empty':
      return holiday === '' ? 'aucun créneau' : `${holiday} rouvert, aucun créneau`;
  }
}

export function describeDay(day: CalendarDay): string {
  return `${formatLongDate(day.date)}, ${status(day)}`;
}

function shortLabel(day: CalendarDay): string {
  switch (day.state) {
    case 'past':
      return '';
    case 'closed':
      return 'Fermé';
    case 'holiday':
      return 'Férié';
    case 'closed-period':
      return 'Période';
    case 'open':
      return slots(day.slotCount);
    case 'empty':
      return '—';
  }
}

export const isActionable = (day: CalendarDay): boolean =>
  day.state !== 'past' && day.state !== 'closed-period';

const toCell = (day: CalendarDay, today: string): CalendarCell => ({
  date: day.date,
  dayOfMonth: Number(day.date.slice(8)),
  state: day.state,
  today: day.date === today,
  actionable: isActionable(day),
  label: describeDay(day),
  shortLabel: shortLabel(day),
  icon: ICONS[day.state] ?? null,
  reopenedHoliday: day.state === 'open' && day.holiday !== null,
});

function toWeeks(cells: readonly CalendarCell[]): readonly (readonly (CalendarCell | null)[])[] {
  const first = cells[0];
  if (first === undefined) return [];
  const leading = (new Date(`${first.date}T00:00:00Z`).getUTCDay() + 6) % DAYS_PER_WEEK;
  const padded = [...Array.from({ length: leading }, () => null), ...cells];
  const trailing = (DAYS_PER_WEEK - (padded.length % DAYS_PER_WEEK)) % DAYS_PER_WEEK;
  const all = [...padded, ...Array.from({ length: trailing }, () => null)];
  return Array.from({ length: all.length / DAYS_PER_WEEK }, (_, week) =>
    all.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK),
  );
}

export function toCalendarMonthView(month: CalendarMonth): CalendarMonthView {
  return {
    month: month.month,
    label: capitalize(formatMonthLabel(month.month)),
    previousMonth: month.previousMonth,
    nextMonth: month.nextMonth,
    closePublicHolidays: month.closePublicHolidays,
    weeks: toWeeks(month.days.map((day) => toCell(day, month.today))),
  };
}

export function wantsOpen(day: CalendarDay): boolean {
  return day.state === 'closed' || day.state === 'holiday';
}

export function announceDay(day: CalendarDay): string {
  const date = formatLongDate(day.date);
  switch (day.state) {
    case 'open':
      return `Rouvert : ${date}, ${slots(day.slotCount)}.`;
    case 'empty':
      return `Rouvert : ${date}, aucun créneau.`;
    default:
      return `Fermé : ${date}.`;
  }
}
