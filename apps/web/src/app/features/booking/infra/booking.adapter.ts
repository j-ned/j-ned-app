import type {
  AdminBooking,
  AvailabilityClosure,
  AvailabilityRule,
  IsoWeekday,
} from '../domain/models/booking-admin.model';
import type {
  BookingCancelPreview,
  BookingConfirmation,
  BookingSlot,
} from '../domain/models/booking.model';
import type {
  AdminBookingDto,
  AvailabilityClosureDto,
  AvailabilityRuleDto,
  BookingCancelPreviewDto,
  BookingConfirmationDto,
  BookingSlotDto,
} from './booking-api.types';

export function toBookingSlot(raw: BookingSlotDto): BookingSlot {
  return { startsAt: raw.startsAt, endsAt: raw.endsAt };
}

export function toBookingConfirmation(raw: BookingConfirmationDto): BookingConfirmation {
  return {
    id: raw.id,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    format: raw.format,
    videoUrl: raw.videoUrl,
  };
}

export function toCancelPreview(raw: BookingCancelPreviewDto): BookingCancelPreview {
  return {
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    format: raw.format,
    status: raw.status,
    cancellable: raw.cancellable,
  };
}

export function toAdminBooking(raw: AdminBookingDto): AdminBooking {
  return {
    id: raw.id,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    company: raw.company,
    message: raw.message,
    format: raw.format,
    videoUrl: raw.videoUrl,
    status: raw.status,
    cancelledAt: raw.cancelledAt,
    cancelledBy: raw.cancelledBy,
    cancelReason: raw.cancelReason,
    reminderSentAt: raw.reminderSentAt,
    createdAt: raw.createdAt,
  };
}

// L'API valide `weekday` entre 1 et 7 (`@Min(1) @Max(7)` et check SQL) : la réponse est déjà bornée.
export function toAvailabilityRule(raw: AvailabilityRuleDto): AvailabilityRule {
  return {
    weekday: raw.weekday as IsoWeekday,
    startMinute: raw.startMinute,
    endMinute: raw.endMinute,
  };
}

export function toAvailabilityClosure(raw: AvailabilityClosureDto): AvailabilityClosure {
  return { id: raw.id, startsOn: raw.startsOn, endsOn: raw.endsOn, reason: raw.reason };
}
