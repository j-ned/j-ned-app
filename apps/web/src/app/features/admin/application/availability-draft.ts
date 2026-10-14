import type {
  AvailabilityRule,
  IsoWeekday,
} from '@features/booking/domain/models/booking-admin.model';

export type AvailabilityWeekdayKey =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WeeklySlotsDraft = Record<AvailabilityWeekdayKey, readonly number[]>;

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
const SLOT_MINUTES = 30;
const FIRST_GRID_SLOT = 16;
const LAST_GRID_SLOT = 41;

export const SLOT_GRID: readonly number[] = Array.from(
  { length: LAST_GRID_SLOT - FIRST_GRID_SLOT + 1 },
  (_, offset) => FIRST_GRID_SLOT + offset,
);

const twoDigits = (value: number): string => String(value).padStart(2, '0');

export function toTimeOfDay(minute: number): string {
  return `${twoDigits(Math.floor(minute / MINUTES_PER_HOUR))}:${twoDigits(minute % MINUTES_PER_HOUR)}`;
}

export const toSlotTime = (halfHour: number): string => toTimeOfDay(halfHour * SLOT_MINUTES);

const isInGrid = (slot: number): boolean => slot >= FIRST_GRID_SLOT && slot <= LAST_GRID_SLOT;

const byNumber = (a: number, b: number): number => a - b;

type SlotRun = { readonly start: number; readonly end: number };

function contiguousRuns(slots: readonly number[]): readonly SlotRun[] {
  return slots.reduce<readonly SlotRun[]>((runs, slot) => {
    const last = runs.at(-1);
    return last?.end === slot
      ? [...runs.slice(0, -1), { start: last.start, end: slot + 1 }]
      : [...runs, { start: slot, end: slot + 1 }];
  }, []);
}

export function toWeeklySlotsDraft(rules: readonly AvailabilityRule[] | null): WeeklySlotsDraft {
  const slotsOf = (weekday: IsoWeekday): readonly number[] => {
    const covered = (rules ?? [])
      .filter((rule) => rule.weekday === weekday)
      .flatMap((rule) => {
        const first = Math.ceil(rule.startMinute / SLOT_MINUTES);
        const end = Math.floor(rule.endMinute / SLOT_MINUTES);
        return Array.from({ length: Math.max(end - first, 0) }, (_, offset) => first + offset);
      });
    return [...new Set(covered)].sort(byNumber);
  };

  return Object.fromEntries(
    AVAILABILITY_WEEKDAYS.map(({ key, weekday }) => [key, slotsOf(weekday)]),
  ) as WeeklySlotsDraft;
}

export function toAvailabilityRules(draft: WeeklySlotsDraft): AvailabilityRule[] {
  return AVAILABILITY_WEEKDAYS.flatMap(({ key, weekday }) =>
    contiguousRuns(draft[key]).map(({ start, end }) => ({
      weekday,
      startMinute: start * SLOT_MINUTES,
      endMinute: end * SLOT_MINUTES,
    })),
  );
}

export function toggleSlot(slots: readonly number[], index: number): readonly number[] {
  return slots.includes(index)
    ? slots.filter((slot) => slot !== index)
    : [...slots, index].sort(byNumber);
}

export function summarizeSlots(slots: readonly number[]): string {
  return contiguousRuns(slots)
    .map(({ start, end }) => `${toSlotTime(start)}–${toSlotTime(end)}`)
    .join(', ');
}

export function hiddenRanges(
  draft: WeeklySlotsDraft,
): readonly { readonly label: string; readonly ranges: string }[] {
  return AVAILABILITY_WEEKDAYS.map(({ key, label }) => ({
    label,
    ranges: summarizeSlots(draft[key].filter((slot) => !isInGrid(slot))),
  })).filter(({ ranges }) => ranges !== '');
}
