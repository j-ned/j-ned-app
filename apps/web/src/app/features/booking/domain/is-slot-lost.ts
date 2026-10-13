import type { BookingFailureReason } from './models/booking.model';

export function isSlotLost(reason: BookingFailureReason): boolean {
  return reason === 'slot-taken' || reason === 'slot-unavailable';
}
