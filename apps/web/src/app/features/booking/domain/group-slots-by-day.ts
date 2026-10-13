import type { BookingDay, BookingSlot, BookingSlotOption } from './models/booking.model';
import {
  formatDayLabel,
  formatDayShortLabel,
  formatParisTime,
  toParisDateKey,
} from './paris-format';

export function groupSlotsByDay(slots: readonly BookingSlot[]): readonly BookingDay[] {
  const slotsByDate = new Map<string, readonly BookingSlotOption[]>();
  for (const slot of slots) {
    const date = toParisDateKey(slot.startsAt);
    const option: BookingSlotOption = { ...slot, timeLabel: formatParisTime(slot.startsAt) };
    slotsByDate.set(date, [...(slotsByDate.get(date) ?? []), option]);
  }
  return Array.from(slotsByDate, ([date, daySlots]) => ({
    date,
    label: formatDayLabel(date),
    shortLabel: formatDayShortLabel(date),
    slots: daySlots,
  }));
}
