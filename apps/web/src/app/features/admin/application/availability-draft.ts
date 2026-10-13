import type {
  AvailabilityRule,
  IsoWeekday,
} from '@features/booking/domain/models/booking-admin.model';

export type AvailabilityRangeRow = { start: string; end: string };

type AvailabilityWeekdayKey =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type AvailabilityDraft = Record<AvailabilityWeekdayKey, AvailabilityRangeRow[]>;

export type AvailabilityWeekday = {
  readonly key: AvailabilityWeekdayKey;
  readonly weekday: IsoWeekday;
  readonly label: string;
};

export const AVAILABILITY_WEEKDAYS: readonly AvailabilityWeekday[] = [
  { key: 'monday', weekday: 1, label: 'Lundi' },
  { key: 'tuesday', weekday: 2, label: 'Mardi' },
  { key: 'wednesday', weekday: 3, label: 'Mercredi' },
  { key: 'thursday', weekday: 4, label: 'Jeudi' },
  { key: 'friday', weekday: 5, label: 'Vendredi' },
  { key: 'saturday', weekday: 6, label: 'Samedi' },
  { key: 'sunday', weekday: 7, label: 'Dimanche' },
];

const MINUTES_PER_HOUR = 60;

const twoDigits = (value: number): string => String(value).padStart(2, '0');

export function toTimeOfDay(minute: number): string {
  return `${twoDigits(Math.floor(minute / MINUTES_PER_HOUR))}:${twoDigits(minute % MINUTES_PER_HOUR)}`;
}

export function toMinuteOfDay(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]) : Number.NaN;
}

export function toAvailabilityDraft(rules: readonly AvailabilityRule[] | null): AvailabilityDraft {
  const rangesOf = (weekday: IsoWeekday): AvailabilityRangeRow[] =>
    (rules ?? [])
      .filter((rule) => rule.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute)
      .map((rule) => ({ start: toTimeOfDay(rule.startMinute), end: toTimeOfDay(rule.endMinute) }));

  return Object.fromEntries(
    AVAILABILITY_WEEKDAYS.map(({ key, weekday }) => [key, rangesOf(weekday)]),
  ) as AvailabilityDraft;
}

export function toAvailabilityRules(draft: AvailabilityDraft): AvailabilityRule[] {
  return AVAILABILITY_WEEKDAYS.flatMap(({ key, weekday }) =>
    draft[key].map((row) => ({
      weekday,
      startMinute: toMinuteOfDay(row.start),
      endMinute: toMinuteOfDay(row.end),
    })),
  );
}

// Seule la plage qui commence le plus tard est signalée : le message ne se répète pas sur les deux.
export function findOverlappedRange(
  rows: readonly AvailabilityRangeRow[],
  index: number,
): number | null {
  const spans = rows.map((row) => ({
    start: toMinuteOfDay(row.start),
    end: toMinuteOfDay(row.end),
  }));
  const isRange = (span: { start: number; end: number }): boolean => span.end > span.start;
  const current = spans[index];
  if (!current || !isRange(current)) return null;

  const overlapped = spans.findIndex(
    (other, otherIndex) =>
      otherIndex !== index &&
      isRange(other) &&
      (other.start < current.start || (other.start === current.start && otherIndex < index)) &&
      other.start < current.end &&
      current.start < other.end,
  );
  return overlapped === -1 ? null : overlapped;
}
