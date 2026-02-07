import type { Observable } from 'rxjs';
import type { Booking, BookingFormData, BookingSubmission, DisabledDate } from '../models';

export type BookingGateway = {
  getBookedSlots(month: string): Observable<readonly Booking[]>;
  submitBooking(data: BookingFormData): Observable<BookingSubmission>;
  getAllBookings(): Observable<readonly Booking[]>;
  updateBookingStatus(id: number, status: string): Observable<Booking>;
  deleteBooking(id: number): Observable<void>;
  getDisabledDates(): Observable<readonly DisabledDate[]>;
  addDisabledDate(date: DisabledDate): Observable<DisabledDate>;
  removeDisabledDate(id: number): Observable<void>;
};

export { BOOKING_GATEWAY } from './booking.gateway.token';
