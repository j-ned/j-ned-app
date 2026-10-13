import type { BookingFormat, BookingResult } from './booking.model';

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvailabilityRule = {
  readonly weekday: IsoWeekday;
  readonly startMinute: number;
  readonly endMinute: number;
};

export type AvailabilityClosure = {
  readonly id: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly reason: string | null;
};

export type NewAvailabilityClosure = Omit<AvailabilityClosure, 'id'>;

export type BookingScope = 'upcoming' | 'past';

export type AdminBooking = {
  readonly id: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly company: string | null;
  readonly message: string;
  readonly format: BookingFormat;
  readonly videoUrl: string | null;
  readonly status: 'confirmed' | 'cancelled';
  readonly cancelledAt: string | null;
  readonly cancelledBy: 'visitor' | 'owner' | null;
  readonly cancelReason: string | null;
  readonly reminderSentAt: string | null;
  readonly createdAt: string;
};

export type BookingAdminFailure =
  'overlap' | 'invalid' | 'not-found' | 'too-late' | 'network' | 'server';

export type BookingAdminResult<TData> = BookingResult<TData, BookingAdminFailure>;
