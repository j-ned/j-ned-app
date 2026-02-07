import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import type { BookingGateway } from '../../domain/gateways';
import type {
  Booking,
  BookingFormData,
  BookingSubmission,
  DisabledDate,
} from '../../domain/models';
import { MOCK_BOOKINGS } from './booking.data';

@Injectable()
export class InMemoryBookingGateway implements BookingGateway {
  private bookings: Booking[] = [...MOCK_BOOKINGS];
  private disabledDates: DisabledDate[] = [];

  getBookedSlots(month: string): Observable<readonly Booking[]> {
    const filtered = this.bookings.filter((b) => b.date.startsWith(month));
    return of(filtered).pipe(delay(300));
  }

  submitBooking(data: BookingFormData): Observable<BookingSubmission> {
    const newBooking: Booking = {
      id: this.bookings.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.bookings.push(newBooking);
    console.log('Booking submitted (in-memory):', newBooking);
    return of({
      success: true,
      message: 'Votre réservation a été confirmée avec succès !',
    }).pipe(delay(500));
  }

  getAllBookings(): Observable<readonly Booking[]> {
    return of([...this.bookings]).pipe(delay(200));
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return throwError(() => new Error('Booking not found'));
    const updated = { ...booking, status } as Booking;
    return of(updated).pipe(delay(200));
  }

  deleteBooking(id: number): Observable<void> {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) return throwError(() => new Error('Booking not found'));
    this.bookings.splice(index, 1);
    return of(undefined as void).pipe(delay(200));
  }

  getDisabledDates(): Observable<readonly DisabledDate[]> {
    return of([...this.disabledDates]).pipe(delay(200));
  }

  addDisabledDate(date: DisabledDate): Observable<DisabledDate> {
    const newDate = { ...date, id: this.disabledDates.length + 1 };
    this.disabledDates.push(newDate);
    return of(newDate).pipe(delay(200));
  }

  removeDisabledDate(id: number): Observable<void> {
    const index = this.disabledDates.findIndex((d) => d.id === id);
    if (index === -1) return throwError(() => new Error('Disabled date not found'));
    this.disabledDates.splice(index, 1);
    return of(undefined as void).pipe(delay(200));
  }
}
