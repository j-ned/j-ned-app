import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import type { BookingGateway } from '../../domain';
import type { Booking, BookingFormData, BookingSubmission, DisabledDate } from '../../domain';
import { API_BASE_URL } from '@shared/api';

@Injectable()
export class HttpBookingGateway implements BookingGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getBookedSlots(month: string): Observable<readonly Booking[]> {
    return this.http
      .get<Booking[]>(`${this.apiUrl}/bookings/slots`, { params: { month } })
      .pipe(catchError(() => of([])));
  }

  submitBooking(data: BookingFormData): Observable<BookingSubmission> {
    return this.http.post<BookingSubmission>(`${this.apiUrl}/bookings`, data).pipe(
      catchError(() =>
        of({
          success: false,
          message: 'Une erreur est survenue lors de la réservation. Veuillez réessayer.',
        }),
      ),
    );
  }

  getAllBookings(): Observable<readonly Booking[]> {
    return this.http.get<{ data: Booking[] }>(`${this.apiUrl}/bookings`).pipe(
      map((res) => res.data),
      catchError(() => of([])),
    );
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/bookings/${id}`, { status });
  }

  deleteBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bookings/${id}`);
  }

  getDisabledDates(): Observable<readonly DisabledDate[]> {
    return this.http
      .get<readonly DisabledDate[]>(`${this.apiUrl}/bookings/disabled-dates`)
      .pipe(catchError(() => of([])));
  }

  addDisabledDate(date: Omit<DisabledDate, 'id'>): Observable<DisabledDate> {
    return this.http.post<DisabledDate>(`${this.apiUrl}/bookings/disabled-dates`, date);
  }

  removeDisabledDate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bookings/disabled-dates/${id}`);
  }
}
