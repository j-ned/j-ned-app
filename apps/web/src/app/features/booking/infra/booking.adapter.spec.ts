import { describe, expect, it } from 'vitest';
import {
  aBookingCancelPreviewDto,
  aBookingConfirmationDto,
  aBookingSlotDto,
  aCalendarDayDto,
  aCalendarMonthDto,
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
  toCalendarDay,
  toCalendarMonth,
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

  it.each([
    { state: 'past' as const, holiday: null, slotCount: 4 },
    { state: 'closed' as const, holiday: null, slotCount: 4 },
    { state: 'holiday' as const, holiday: 'Armistice 1918', slotCount: 4 },
    { state: 'open' as const, holiday: 'Armistice 1918', slotCount: 4 },
    { state: 'open' as const, holiday: null, slotCount: 46 },
    { state: 'empty' as const, holiday: null, slotCount: 0 },
  ])(
    'Given a $state day DTO with holiday $holiday and $slotCount slots When adapted Then state, holiday and slot count are kept as sent',
    ({ state, holiday, slotCount }) => {
      const raw = aCalendarDayDto({ date: '2026-11-11', state, holiday, slotCount, closure: null });

      expect(toCalendarDay(raw)).toEqual({
        date: '2026-11-11',
        state,
        holiday,
        slotCount,
        closure: null,
      });
    },
  );

  it('Given a closed-period day DTO whose closure carries an extra id When adapted Then the closure keeps only its dates and reason', () => {
    const raw = aCalendarDayDto({
      date: '2026-12-24',
      state: 'closed-period',
      holiday: null,
      slotCount: 4,
      closure: Object.assign(
        { startsOn: '2026-12-24', endsOn: '2027-01-01', reason: 'Congés' },
        { id: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a9f' },
      ),
    });

    expect(toCalendarDay(raw)).toEqual({
      date: '2026-12-24',
      state: 'closed-period',
      holiday: null,
      slotCount: 4,
      closure: { startsOn: '2026-12-24', endsOn: '2027-01-01', reason: 'Congés' },
    });
  });

  it('Given a day DTO with an unexpected field When adapted Then only the five contract fields are kept', () => {
    const raw = Object.assign(aCalendarDayDto({ date: '2026-11-12', state: 'open' }), {
      overrideKind: 'open',
    });

    expect(toCalendarDay(raw)).toEqual({
      date: '2026-11-12',
      state: 'open',
      holiday: null,
      slotCount: 4,
      closure: null,
    });
  });

  it.each([
    { month: '2026-11', previousMonth: null, nextMonth: '2026-12', closePublicHolidays: true },
    { month: '2027-11', previousMonth: '2027-10', nextMonth: null, closePublicHolidays: false },
  ])(
    'Given the month DTO $month When adapted Then bounds, holiday setting and days are kept and extra fields dropped',
    ({ month, previousMonth, nextMonth, closePublicHolidays }) => {
      const raw = Object.assign(
        aCalendarMonthDto({
          month,
          today: '2026-11-10',
          previousMonth,
          nextMonth,
          closePublicHolidays,
          days: [
            aCalendarDayDto({ date: `${month}-01`, state: 'empty', slotCount: 0 }),
            Object.assign(
              aCalendarDayDto({
                date: `${month}-11`,
                state: 'holiday',
                holiday: 'Armistice 1918',
                slotCount: 4,
              }),
              { weekday: 3 },
            ),
          ],
        }),
        { timeZone: 'Europe/Paris' },
      );

      expect(toCalendarMonth(raw)).toEqual({
        month,
        today: '2026-11-10',
        previousMonth,
        nextMonth,
        closePublicHolidays,
        days: [
          { date: `${month}-01`, state: 'empty', holiday: null, slotCount: 0, closure: null },
          {
            date: `${month}-11`,
            state: 'holiday',
            holiday: 'Armistice 1918',
            slotCount: 4,
            closure: null,
          },
        ],
      });
    },
  );
});
