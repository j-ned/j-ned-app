import type {
  AdminBooking,
  AvailabilityClosure,
  AvailabilityRule,
  BookingFeedSubscription,
  CalendarDay,
  CalendarMonth,
} from '../domain/models/booking-admin.model';
import type {
  BookingCancelPreview,
  BookingConfirmation,
  BookingDay,
  BookingRequest,
  BookingSlot,
} from '../domain/models/booking.model';
import type {
  AdminBookingDto,
  ApiErrorBodyDto,
  AvailabilityClosureDto,
  AvailabilityRuleDto,
  BookingCancelPreviewDto,
  BookingConfirmationDto,
  BookingFeedSubscriptionDto,
  BookingSlotDto,
  CalendarDayDto,
  CalendarMonthResponseDto,
} from '../infra/booking-api.types';

type ActiveFeedSubscription = Extract<BookingFeedSubscription, { kind: 'active' }>;
type ActiveFeedSubscriptionDto = Extract<BookingFeedSubscriptionDto, { status: 'active' }>;

export function aBookingSlot(overrides: Partial<BookingSlot> = {}): BookingSlot {
  return {
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    ...overrides,
  };
}

export function aBookingDay(overrides: Partial<BookingDay> = {}): BookingDay {
  return {
    date: '2026-10-19',
    label: 'lundi 19 octobre',
    shortLabel: 'lun. 19',
    slots: [],
    ...overrides,
  };
}

export function aBookingRequest(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    startsAt: '2026-10-19T07:00:00.000Z',
    name: 'Camille Martin',
    email: 'camille@example.com',
    format: 'video',
    phone: null,
    company: null,
    message: 'Refonte d’une application Angular.',
    website: '',
    ...overrides,
  };
}

export function aBookingConfirmation(
  overrides: Partial<BookingConfirmation> = {},
): BookingConfirmation {
  return {
    id: '7b0a3c9e-2f4d-4b8a-9c1e-5d6f7a8b9c0d',
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    format: 'video',
    videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
    ...overrides,
  };
}

export function aBookingCancelPreview(
  overrides: Partial<BookingCancelPreview> = {},
): BookingCancelPreview {
  return {
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    format: 'video',
    status: 'confirmed',
    cancellable: true,
    ...overrides,
  };
}

export function anAdminBooking(overrides: Partial<AdminBooking> = {}): AdminBooking {
  return {
    id: '7b0a3c9e-2f4d-4b8a-9c1e-5d6f7a8b9c0d',
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    name: 'Camille Martin',
    email: 'camille@example.com',
    phone: null,
    company: null,
    message: 'Refonte d’une application Angular.',
    format: 'video',
    videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
    status: 'confirmed',
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    reminderSentAt: null,
    createdAt: '2026-10-13T09:00:00.000Z',
    ...overrides,
  };
}

export function anAvailabilityRule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return { weekday: 1, startMinute: 540, endMinute: 720, ...overrides };
}

export function anAvailabilityClosure(
  overrides: Partial<AvailabilityClosure> = {},
): AvailabilityClosure {
  return {
    id: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a9f',
    startsOn: '2026-12-24',
    endsOn: '2027-01-01',
    reason: 'Congés',
    ...overrides,
  };
}

export function aCalendarDay(overrides: Partial<CalendarDay> = {}): CalendarDay {
  return {
    date: '2026-11-12',
    state: 'open',
    holiday: null,
    slotCount: 4,
    closure: null,
    ...overrides,
  };
}

export function aCalendarMonth(overrides: Partial<CalendarMonth> = {}): CalendarMonth {
  return {
    month: '2026-11',
    today: '2026-11-10',
    previousMonth: null,
    nextMonth: '2026-12',
    closePublicHolidays: true,
    days: [aCalendarDay()],
    ...overrides,
  };
}

export function aBookingFeedSubscription(
  overrides: Partial<ActiveFeedSubscription> = {},
): ActiveFeedSubscription {
  return {
    kind: 'active',
    url: 'https://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics',
    createdAt: '2026-10-15T08:32:00.000Z',
    ...overrides,
  };
}

export function aBookingSlotDto(overrides: Partial<BookingSlotDto> = {}): BookingSlotDto {
  return {
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    ...overrides,
  };
}

export function aBookingConfirmationDto(
  overrides: Partial<BookingConfirmationDto> = {},
): BookingConfirmationDto {
  return {
    id: '7b0a3c9e-2f4d-4b8a-9c1e-5d6f7a8b9c0d',
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    format: 'video',
    videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
    ...overrides,
  };
}

export function aBookingCancelPreviewDto(
  overrides: Partial<BookingCancelPreviewDto> = {},
): BookingCancelPreviewDto {
  return {
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    format: 'video',
    status: 'confirmed',
    cancellable: true,
    ...overrides,
  };
}

export function anAdminBookingDto(overrides: Partial<AdminBookingDto> = {}): AdminBookingDto {
  return {
    id: '7b0a3c9e-2f4d-4b8a-9c1e-5d6f7a8b9c0d',
    startsAt: '2026-10-19T07:00:00.000Z',
    endsAt: '2026-10-19T07:30:00.000Z',
    name: 'Camille Martin',
    email: 'camille@example.com',
    phone: null,
    company: null,
    message: 'Refonte d’une application Angular.',
    format: 'video',
    videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
    status: 'confirmed',
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    reminderSentAt: null,
    createdAt: '2026-10-13T09:00:00.000Z',
    ...overrides,
  };
}

export function anAvailabilityRuleDto(
  overrides: Partial<AvailabilityRuleDto> = {},
): AvailabilityRuleDto {
  return { weekday: 1, startMinute: 540, endMinute: 720, ...overrides };
}

export function anAvailabilityClosureDto(
  overrides: Partial<AvailabilityClosureDto> = {},
): AvailabilityClosureDto {
  return {
    id: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a9f',
    startsOn: '2026-12-24',
    endsOn: '2027-01-01',
    reason: 'Congés',
    ...overrides,
  };
}

export function aCalendarDayDto(overrides: Partial<CalendarDayDto> = {}): CalendarDayDto {
  return {
    date: '2026-11-12',
    state: 'open',
    holiday: null,
    slotCount: 4,
    closure: null,
    ...overrides,
  };
}

export function aCalendarMonthDto(
  overrides: Partial<CalendarMonthResponseDto> = {},
): CalendarMonthResponseDto {
  return {
    month: '2026-11',
    today: '2026-11-10',
    previousMonth: null,
    nextMonth: '2026-12',
    closePublicHolidays: true,
    days: [aCalendarDayDto()],
    ...overrides,
  };
}

export function aBookingFeedSubscriptionDto(
  overrides: Partial<ActiveFeedSubscriptionDto> = {},
): ActiveFeedSubscriptionDto {
  return {
    status: 'active',
    token: 'stubFeedToken000000000000000000000000000000',
    createdAt: '2026-10-15T08:32:00.000Z',
    ...overrides,
  };
}

export function anApiErrorBody(statusCode: number, error: string): ApiErrorBodyDto {
  return {
    statusCode,
    error,
    message: 'Message témoin.',
    path: '/api/booking',
    timestamp: '2026-10-13T09:00:00.000Z',
  };
}
