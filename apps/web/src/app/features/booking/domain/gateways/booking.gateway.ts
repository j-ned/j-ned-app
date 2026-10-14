import type { Observable } from 'rxjs';
import type {
  AdminBooking,
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminResult,
  BookingScope,
  CalendarDay,
  CalendarMonth,
  NewAvailabilityClosure,
} from '../models/booking-admin.model';
import type {
  BookingCancelPreviewResult,
  BookingCancelResult,
  BookingRequest,
  BookingSlot,
  BookingSubmission,
} from '../models/booking.model';

export abstract class BookingGateway {
  abstract getSlots(): Observable<readonly BookingSlot[]>;
  abstract createBooking(request: BookingRequest): Observable<BookingSubmission>;
  abstract previewCancellation(token: string): Observable<BookingCancelPreviewResult>;
  abstract cancelBooking(token: string): Observable<BookingCancelResult>;

  abstract getBookings(scope: BookingScope): Observable<readonly AdminBooking[]>;
  abstract getUpcomingCount(): Observable<number>;
  abstract invalidateUpcomingCount(): void;
  abstract cancelBookingAsOwner(
    id: string,
    reason: string | null,
  ): Observable<BookingAdminResult<AdminBooking>>;
  abstract getAvailabilityRules(): Observable<readonly AvailabilityRule[]>;
  abstract replaceAvailabilityRules(
    rules: readonly AvailabilityRule[],
  ): Observable<BookingAdminResult<readonly AvailabilityRule[]>>;
  abstract getClosures(): Observable<readonly AvailabilityClosure[]>;
  abstract createClosure(
    closure: NewAvailabilityClosure,
  ): Observable<BookingAdminResult<AvailabilityClosure>>;
  abstract deleteClosure(id: string): Observable<BookingAdminResult<null>>;
  abstract getAvailabilityCalendar(month: string | null): Observable<CalendarMonth>;
  abstract setDayOpen(date: string, open: boolean): Observable<BookingAdminResult<CalendarDay>>;
  abstract setClosePublicHolidays(value: boolean): Observable<BookingAdminResult<boolean>>;
}
