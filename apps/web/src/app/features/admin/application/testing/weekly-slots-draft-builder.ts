import type { WeeklySlotsDraft } from '../availability-draft';

export function aWeeklySlotsDraft(overrides: Partial<WeeklySlotsDraft> = {}): WeeklySlotsDraft {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    ...overrides,
  };
}

const halfHourOf = (time: string): number => {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 2 + Number(minutes) / 30;
};

export function halfHoursBetween(start: string, end: string): readonly number[] {
  const first = halfHourOf(start);
  return Array.from({ length: halfHourOf(end) - first }, (_, offset) => first + offset);
}
