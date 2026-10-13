import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  catchError,
  map,
  of,
  ReplaySubject,
  share,
  startWith,
  Subject,
  switchMap,
  type Observable,
} from 'rxjs';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import { BookingGateway } from '../domain/gateways/booking.gateway';
import type {
  AdminBooking,
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminFailure,
  BookingAdminResult,
  BookingScope,
  NewAvailabilityClosure,
} from '../domain/models/booking-admin.model';
import type {
  BookingCancelFailure,
  BookingCancelPreviewResult,
  BookingCancelResult,
  BookingFailureReason,
  BookingRequest,
  BookingResult,
  BookingSlot,
  BookingSubmission,
} from '../domain/models/booking.model';
import type {
  AdminBookingDto,
  AvailabilityClosureDto,
  AvailabilityRuleDto,
  BookingCancelPreviewDto,
  BookingConfirmationDto,
  BookingSlotsResponseDto,
} from './booking-api.types';
import {
  toAdminBooking,
  toAvailabilityClosure,
  toAvailabilityRule,
  toBookingConfirmation,
  toBookingSlot,
  toCancelPreview,
} from './booking.adapter';

type DataEnvelope<T> = { readonly data: T[] };

function apiErrorCode(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body: unknown = err.error;
  if (typeof body !== 'object' || body === null || !('error' in body)) return null;
  return typeof body.error === 'string' ? body.error : null;
}

const statusOf = (err: unknown): number | null =>
  err instanceof HttpErrorResponse ? err.status : null;

function toBookingFailure(err: unknown): BookingFailureReason {
  const code = apiErrorCode(err);
  switch (statusOf(err)) {
    case 0:
      return 'network';
    case 400:
      return 'invalid';
    case 409:
      return code === 'slot_taken' ? 'slot-taken' : 'server';
    case 422:
      if (code === 'slot_unavailable') return 'slot-unavailable';
      if (code === 'booking_limit_reached') return 'limit-reached';
      return 'server';
    case 429:
      return 'rate-limited';
    default:
      return 'server';
  }
}

// Un jeton malformé (400) désigne, pour le visiteur, un lien qui ne mène à aucun rendez-vous.
function toCancelFailure(err: unknown): BookingCancelFailure {
  switch (statusOf(err)) {
    case 0:
      return 'network';
    case 400:
    case 404:
      return 'not-found';
    case 409:
      return 'too-late';
    default:
      return 'server';
  }
}

function toAdminFailure(err: unknown): BookingAdminFailure {
  switch (statusOf(err)) {
    case 0:
      return 'network';
    case 400:
      return apiErrorCode(err) === 'rules_overlap' ? 'overlap' : 'invalid';
    case 404:
      return 'not-found';
    case 409:
      return 'too-late';
    default:
      return 'server';
  }
}

function toResult<TData, TReason>(
  toFailure: (err: unknown) => TReason,
): (source$: Observable<TData>) => Observable<BookingResult<TData, TReason>> {
  return (source$) =>
    source$.pipe(
      map((data) => ({ success: true as const, data })),
      catchError((err: unknown) => of({ success: false as const, reason: toFailure(err) })),
    );
}

@Injectable()
export class HttpBookingGateway extends BookingGateway {
  private readonly http = inject(HttpClient);
  private readonly bookingUrl = `${inject(API_BASE_URL)}/booking`;

  private readonly _upcomingRefresh$ = new Subject<void>();
  private readonly upcomingCount$ = this._upcomingRefresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http
        .get<{ count: number }>(`${this.bookingUrl}/bookings/upcoming-count`, {
          context: silentErrors(),
        })
        .pipe(map((res) => res.count)),
    ),
    share({
      connector: () => new ReplaySubject<number>(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    }),
  );

  getSlots(): Observable<readonly BookingSlot[]> {
    return this.http
      .get<BookingSlotsResponseDto>(`${this.bookingUrl}/slots`, { context: silentErrors() })
      .pipe(map((res) => res.slots.map(toBookingSlot)));
  }

  createBooking(request: BookingRequest): Observable<BookingSubmission> {
    return this.http
      .post<BookingConfirmationDto>(`${this.bookingUrl}/bookings`, request, {
        context: silentErrors(),
      })
      .pipe(map(toBookingConfirmation), toResult(toBookingFailure));
  }

  previewCancellation(token: string): Observable<BookingCancelPreviewResult> {
    return this.http
      .post<BookingCancelPreviewDto>(
        `${this.bookingUrl}/bookings/cancel/preview`,
        { token },
        { context: silentErrors() },
      )
      .pipe(map(toCancelPreview), toResult(toCancelFailure));
  }

  cancelBooking(token: string): Observable<BookingCancelResult> {
    return this.http
      .post(`${this.bookingUrl}/bookings/cancel`, { token }, { context: silentErrors() })
      .pipe(
        map(() => null),
        toResult(toCancelFailure),
      );
  }

  getBookings(scope: BookingScope): Observable<readonly AdminBooking[]> {
    return this.http
      .get<DataEnvelope<AdminBookingDto>>(`${this.bookingUrl}/bookings`, {
        params: { scope },
        context: silentErrors(),
      })
      .pipe(map((res) => res.data.map(toAdminBooking)));
  }

  getUpcomingCount(): Observable<number> {
    return this.upcomingCount$;
  }

  invalidateUpcomingCount(): void {
    this._upcomingRefresh$.next();
  }

  cancelBookingAsOwner(
    id: string,
    reason: string | null,
  ): Observable<BookingAdminResult<AdminBooking>> {
    return this.http
      .patch<AdminBookingDto>(
        `${this.bookingUrl}/bookings/${id}/cancel`,
        { reason },
        { context: silentErrors() },
      )
      .pipe(map(toAdminBooking), toResult(toAdminFailure));
  }

  getAvailabilityRules(): Observable<readonly AvailabilityRule[]> {
    return this.http
      .get<DataEnvelope<AvailabilityRuleDto>>(`${this.bookingUrl}/availability/rules`, {
        context: silentErrors(),
      })
      .pipe(map((res) => res.data.map(toAvailabilityRule)));
  }

  replaceAvailabilityRules(
    rules: readonly AvailabilityRule[],
  ): Observable<BookingAdminResult<readonly AvailabilityRule[]>> {
    return this.http
      .put<DataEnvelope<AvailabilityRuleDto>>(
        `${this.bookingUrl}/availability/rules`,
        { rules },
        { context: silentErrors() },
      )
      .pipe(
        map((res): readonly AvailabilityRule[] => res.data.map(toAvailabilityRule)),
        toResult(toAdminFailure),
      );
  }

  getClosures(): Observable<readonly AvailabilityClosure[]> {
    return this.http
      .get<DataEnvelope<AvailabilityClosureDto>>(`${this.bookingUrl}/availability/closures`, {
        context: silentErrors(),
      })
      .pipe(map((res) => res.data.map(toAvailabilityClosure)));
  }

  createClosure(
    closure: NewAvailabilityClosure,
  ): Observable<BookingAdminResult<AvailabilityClosure>> {
    return this.http
      .post<AvailabilityClosureDto>(`${this.bookingUrl}/availability/closures`, closure, {
        context: silentErrors(),
      })
      .pipe(map(toAvailabilityClosure), toResult(toAdminFailure));
  }

  deleteClosure(id: string): Observable<BookingAdminResult<null>> {
    return this.http
      .delete(`${this.bookingUrl}/availability/closures/${id}`, { context: silentErrors() })
      .pipe(
        map(() => null),
        toResult(toAdminFailure),
      );
  }
}
