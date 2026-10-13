import { describe, expect, it } from 'vitest';
import {
  aBookingCancelPreviewDto,
  aBookingConfirmationDto,
  aBookingSlotDto,
  anAdminBookingDto,
  anAvailabilityClosureDto,
  anAvailabilityRuleDto,
} from '../testing/booking-builders';
import {
  toAdminBooking,
  toAvailabilityClosure,
  toAvailabilityRule,
  toBookingConfirmation,
  toBookingSlot,
  toCancelPreview,
} from './booking.adapter';

describe('booking adapters', () => {
  it('Given a slot DTO with an extra field When adapted Then only its two instants are kept', () => {
    const raw = Object.assign(
      aBookingSlotDto({
        startsAt: '2026-10-26T08:00:00.000Z',
        endsAt: '2026-10-26T08:30:00.000Z',
      }),
      { timeZone: 'Europe/Paris' },
    );

    expect(toBookingSlot(raw)).toEqual({
      startsAt: '2026-10-26T08:00:00.000Z',
      endsAt: '2026-10-26T08:30:00.000Z',
    });
  });

  it.each([
    { format: 'video' as const, videoUrl: 'https://meet.jit.si/nedellec-0123456789abcdef' },
    { format: 'phone' as const, videoUrl: null },
  ])(
    'Given a $format confirmation DTO When adapted Then id, instants, format and video link are kept',
    ({ format, videoUrl }) => {
      const raw = aBookingConfirmationDto({
        id: 'b1c2d3e4-0000-4000-8000-000000000001',
        startsAt: '2026-11-04T10:00:00.000Z',
        endsAt: '2026-11-04T10:30:00.000Z',
        format,
        videoUrl,
      });

      expect(toBookingConfirmation(raw)).toEqual({
        id: 'b1c2d3e4-0000-4000-8000-000000000001',
        startsAt: '2026-11-04T10:00:00.000Z',
        endsAt: '2026-11-04T10:30:00.000Z',
        format,
        videoUrl,
      });
    },
  );

  it('Given a cancelled preview DTO When adapted Then status and cancellable flag are kept as sent', () => {
    const raw = aBookingCancelPreviewDto({
      startsAt: '2026-11-04T10:00:00.000Z',
      endsAt: '2026-11-04T10:30:00.000Z',
      format: 'phone',
      status: 'cancelled',
      cancellable: false,
    });

    expect(toCancelPreview(raw)).toEqual({
      startsAt: '2026-11-04T10:00:00.000Z',
      endsAt: '2026-11-04T10:30:00.000Z',
      format: 'phone',
      status: 'cancelled',
      cancellable: false,
    });
  });

  it('Given an admin booking DTO carrying an unexpected secret When adapted Then the sixteen contract fields are kept and nothing else', () => {
    const raw = Object.assign(
      anAdminBookingDto({
        id: 'b1c2d3e4-0000-4000-8000-000000000002',
        startsAt: '2026-11-04T10:00:00.000Z',
        endsAt: '2026-11-04T10:30:00.000Z',
        name: 'Léa Dubois',
        email: 'lea@example.com',
        phone: '+33 6 12 34 56 78',
        company: 'Atelier Dubois',
        message: 'Audit de performance.',
        format: 'phone',
        videoUrl: null,
        status: 'cancelled',
        cancelledAt: '2026-11-01T09:00:00.000Z',
        cancelledBy: 'owner',
        cancelReason: 'Imprévu.',
        reminderSentAt: null,
        createdAt: '2026-10-20T08:00:00.000Z',
      }),
      { cancelTokenHash: 'f'.repeat(64) },
    );

    expect(toAdminBooking(raw)).toEqual({
      id: 'b1c2d3e4-0000-4000-8000-000000000002',
      startsAt: '2026-11-04T10:00:00.000Z',
      endsAt: '2026-11-04T10:30:00.000Z',
      name: 'Léa Dubois',
      email: 'lea@example.com',
      phone: '+33 6 12 34 56 78',
      company: 'Atelier Dubois',
      message: 'Audit de performance.',
      format: 'phone',
      videoUrl: null,
      status: 'cancelled',
      cancelledAt: '2026-11-01T09:00:00.000Z',
      cancelledBy: 'owner',
      cancelReason: 'Imprévu.',
      reminderSentAt: null,
      createdAt: '2026-10-20T08:00:00.000Z',
    });
  });

  it.each([
    { weekday: 1, startMinute: 540, endMinute: 720 },
    { weekday: 7, startMinute: 0, endMinute: 1440 },
  ])(
    'Given the rule DTO weekday $weekday $startMinute–$endMinute When adapted Then the rule is kept as is',
    (rule) => {
      expect(toAvailabilityRule(anAvailabilityRuleDto(rule))).toEqual(rule);
    },
  );

  it.each([{ reason: 'Congés' }, { reason: null }])(
    'Given a closure DTO with reason $reason When adapted Then id, Paris dates and reason are kept',
    ({ reason }) => {
      const raw = anAvailabilityClosureDto({
        id: 'c0ffee00-0000-4000-8000-000000000003',
        startsOn: '2026-12-24',
        endsOn: '2027-01-01',
        reason,
      });

      expect(toAvailabilityClosure(raw)).toEqual({
        id: 'c0ffee00-0000-4000-8000-000000000003',
        startsOn: '2026-12-24',
        endsOn: '2027-01-01',
        reason,
      });
    },
  );
});
