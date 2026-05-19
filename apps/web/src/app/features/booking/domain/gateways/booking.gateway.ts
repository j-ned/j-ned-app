import type { Observable } from 'rxjs';
import type { Booking, BookingFormData, BookingSubmission, DisabledDate } from '../models';

export type BookingGateway = {
  getBookedSlots(month: string): Observable<readonly Booking[]>;
  submitBooking(data: BookingFormData): Observable<BookingSubmission>;
  getAllBookings(): Observable<readonly Booking[]>;
  invalidateAllBookings(): void;
  updateBookingStatus(id: string, status: string): Observable<Booking>;
  deleteBooking(id: string): Observable<void>;
  getDisabledDates(): Observable<readonly DisabledDate[]>;
  addDisabledDate(date: Omit<DisabledDate, 'id'>): Observable<DisabledDate>;
  removeDisabledDate(id: string): Observable<void>;
};
