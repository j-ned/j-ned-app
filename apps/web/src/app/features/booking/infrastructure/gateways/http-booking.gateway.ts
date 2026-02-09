import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { BookingGateway } from '../../domain';
import type {
  Booking,
  BookingFormData,
  BookingSubmission,
  DisabledDate,
} from '../../domain';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable()
export class HttpBookingGateway implements BookingGateway {
  private readonly http = inject(HttpClient);

  getBookedSlots(month: string): Observable<readonly Booking[]> {
    return this.http
      .get<Booking[]>(`${API_BASE_URL}/bookings?date_like=${month}`)
      .pipe(catchError(() => of([])));
  }

  submitBooking(data: BookingFormData): Observable<BookingSubmission> {
    const payload = { ...data, createdAt: new Date().toISOString() };
    return this.http.post<Booking>(`${API_BASE_URL}/bookings`, payload).pipe(
      map(() => ({
        success: true,
        message: 'Votre réservation a été confirmée avec succès !',
      })),
      catchError(() =>
        of({
          success: false,
          message: 'Une erreur est survenue lors de la réservation. Veuillez réessayer.',
        }),
      ),
    );
  }

  getAllBookings(): Observable<readonly Booking[]> {
    return this.http
      .get<readonly Booking[]>(`${API_BASE_URL}/bookings`)
      .pipe(catchError(() => of([])));
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    return this.http.get<Booking[]>(`${API_BASE_URL}/bookings?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Booking not found'));
        return this.http.patch<Booking>(`${API_BASE_URL}/bookings/${data[0].id}`, { status });
      }),
    );
  }

  deleteBooking(id: number): Observable<void> {
    return this.http.get<Booking[]>(`${API_BASE_URL}/bookings?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Booking not found'));
        return this.http.delete<void>(`${API_BASE_URL}/bookings/${data[0].id}`);
      }),
    );
  }

  getDisabledDates(): Observable<readonly DisabledDate[]> {
    return this.http
      .get<readonly DisabledDate[]>(`${API_BASE_URL}/disabledDates`)
      .pipe(catchError(() => of([])));
  }

  addDisabledDate(date: DisabledDate): Observable<DisabledDate> {
    return this.http.post<DisabledDate>(`${API_BASE_URL}/disabledDates`, date);
  }

  removeDisabledDate(id: number): Observable<void> {
    return this.http.get<DisabledDate[]>(`${API_BASE_URL}/disabledDates?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Disabled date not found'));
        return this.http.delete<void>(`${API_BASE_URL}/disabledDates/${data[0].id}`);
      }),
    );
  }
}
