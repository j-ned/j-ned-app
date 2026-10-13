import { defer, of, type Observable } from 'rxjs';
import { BookingGateway } from '../domain/gateways/booking.gateway';
import type {
  AdminBooking,
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminResult,
} from '../domain/models/booking-admin.model';
import type {
  BookingCancelPreviewResult,
  BookingCancelResult,
  BookingSlot,
  BookingSubmission,
} from '../domain/models/booking.model';
import {
  aBookingCancelPreview,
  aBookingConfirmation,
  anAdminBooking,
  anAvailabilityClosure,
} from './booking-builders';

class StubBookingGateway extends BookingGateway {
  getSlots(): Observable<readonly BookingSlot[]> {
    return defer(() => of([]));
  }

  createBooking(): Observable<BookingSubmission> {
    return defer(() => of({ success: true, data: aBookingConfirmation() } as const));
  }

  previewCancellation(): Observable<BookingCancelPreviewResult> {
    return defer(() => of({ success: true, data: aBookingCancelPreview() } as const));
  }

  cancelBooking(): Observable<BookingCancelResult> {
    return defer(() => of({ success: true, data: null } as const));
  }

  getBookings(): Observable<readonly AdminBooking[]> {
    return defer(() => of([]));
  }

  getUpcomingCount(): Observable<number> {
    return defer(() => of(0));
  }

  invalidateUpcomingCount(): void {
    return;
  }

  cancelBookingAsOwner(): Observable<BookingAdminResult<AdminBooking>> {
    return defer(() =>
      of({
        success: true,
        data: anAdminBooking({ status: 'cancelled', cancelledBy: 'owner' }),
      } as const),
    );
  }

  getAvailabilityRules(): Observable<readonly AvailabilityRule[]> {
    return defer(() => of([]));
  }

  replaceAvailabilityRules(
    rules: readonly AvailabilityRule[],
  ): Observable<BookingAdminResult<readonly AvailabilityRule[]>> {
    return defer(() => of({ success: true, data: rules } as const));
  }

  getClosures(): Observable<readonly AvailabilityClosure[]> {
    return defer(() => of([]));
  }

  createClosure(): Observable<BookingAdminResult<AvailabilityClosure>> {
    return defer(() => of({ success: true, data: anAvailabilityClosure() } as const));
  }

  deleteClosure(): Observable<BookingAdminResult<null>> {
    return defer(() => of({ success: true, data: null } as const));
  }
}

export function stubBookingGateway(overrides: Partial<BookingGateway> = {}): BookingGateway {
  return Object.assign(new StubBookingGateway(), overrides);
}
