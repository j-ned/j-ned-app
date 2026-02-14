import { inject, Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { BookingGateway } from '../../domain';
import type { Booking, BookingFormData, BookingSubmission, DisabledDate } from '../../domain';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';
import { toCamelCase, toSnakeCase } from '../../../../shared/supabase/column-mapper';

@Injectable()
export class SupabaseBookingGateway implements BookingGateway {
  private readonly supabase = inject(SupabaseClientService);

  getBookedSlots(month: string): Observable<readonly Booking[]> {
    const [year, mon] = month.split('-').map(Number);
    const start = `${year}-${String(mon).padStart(2, '0')}-01`;
    const nextMonth =
      mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`;
    return from(
      this.supabase.client.from('bookings').select('*').gte('date', start).lt('date', nextMonth),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Booking>(row));
      }),
      catchError(() => of([])),
    );
  }

  submitBooking(formData: BookingFormData): Observable<BookingSubmission> {
    return from(
      this.supabase.client
        .from('bookings')
        .insert(toSnakeCase(formData as unknown as Record<string, unknown>)),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return {
          success: true,
          message: 'Votre réservation a été confirmée avec succès !',
        };
      }),
      catchError(() =>
        of({
          success: false,
          message: 'Une erreur est survenue lors de la réservation. Veuillez réessayer.',
        }),
      ),
    );
  }

  getAllBookings(): Observable<readonly Booking[]> {
    return from(this.supabase.client.from('bookings').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Booking>(row));
      }),
      catchError(() => of([])),
    );
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    return from(
      this.supabase.client.from('bookings').update({ status }).eq('id', id).select().single(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Booking not found'));
        return of(toCamelCase<Booking>(data));
      }),
    );
  }

  deleteBooking(id: number): Observable<void> {
    return from(this.supabase.client.from('bookings').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getDisabledDates(): Observable<readonly DisabledDate[]> {
    return from(this.supabase.client.from('disabled_dates').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<DisabledDate>(row));
      }),
      catchError(() => of([])),
    );
  }

  addDisabledDate(date: Omit<DisabledDate, 'id'>): Observable<DisabledDate> {
    return from(
      this.supabase.client
        .from('disabled_dates')
        .insert(toSnakeCase(date as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<DisabledDate>(data);
      }),
    );
  }

  removeDisabledDate(id: number): Observable<void> {
    return from(this.supabase.client.from('disabled_dates').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
