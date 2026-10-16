import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL, API_LINK_BASE_URL } from '@shared/api/api-config';
import {
  aBookingCancelPreviewDto,
  aBookingConfirmationDto,
  aBookingFeedSubscriptionDto,
  aBookingRequest,
  aBookingSlotDto,
  aCalendarDayDto,
  aCalendarMonthDto,
  anAdminBookingDto,
  anApiErrorBody,
  anAvailabilityClosure,
  anAvailabilityClosureDto,
  anAvailabilityRule,
  anAvailabilityRuleDto,
} from '../testing/booking-builders';
import { HttpBookingGateway } from './http-booking.gateway';

const BASE = 'https://api.test/api';
const BOOKING = `${BASE}/booking`;
const TOKEN = `${'a'.repeat(21)}_${'B'.repeat(21)}`;
const BOOKING_ID = '7b0a3c9e-2f4d-4b8a-9c1e-5d6f7a8b9c0d';
const CLOSURE_ID = '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a9f';

type Reply = { readonly status: number; readonly body: string | object | null };

const NETWORK_DOWN: Reply = { status: 0, body: null };

function reply(request: TestRequest, { status, body }: Reply): void {
  if (status === 0) {
    request.error(new ProgressEvent('error'), { status: 0, statusText: '' });
    return;
  }
  request.flush(body, { status, statusText: 'Error' });
}

const coded = (status: number, error: string): Reply => ({
  status,
  body: anApiErrorBody(status, error),
});

const settled = <T>(source: Observable<T>): Promise<T | 'error'> =>
  firstValueFrom(source).then(
    (value) => value,
    () => 'error' as const,
  );

describe('HttpBookingGateway', () => {
  let gateway: HttpBookingGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpBookingGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    gateway = TestBed.inject(HttpBookingGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('free slots', () => {
    it('Given the API answers the bookable window When the slots are read Then a silent GET yields the slots without the time zone envelope', async () => {
      const result = firstValueFrom(gateway.getSlots());

      const request = http.expectOne(`${BOOKING}/slots`);
      request.flush({
        timeZone: 'Europe/Paris',
        slots: [
          aBookingSlotDto({
            startsAt: '2026-10-19T07:00:00.000Z',
            endsAt: '2026-10-19T07:30:00.000Z',
          }),
          aBookingSlotDto({
            startsAt: '2026-10-26T08:00:00.000Z',
            endsAt: '2026-10-26T08:30:00.000Z',
          }),
        ],
      });

      expect({
        method: request.request.method,
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        slots: await result,
      }).toEqual({
        method: 'GET',
        silent: true,
        slots: [
          { startsAt: '2026-10-19T07:00:00.000Z', endsAt: '2026-10-19T07:30:00.000Z' },
          { startsAt: '2026-10-26T08:00:00.000Z', endsAt: '2026-10-26T08:30:00.000Z' },
        ],
      });
    });
  });

  describe('booking creation', () => {
    it('Given a free slot When the visitor books by video Then the request is posted as is and the confirmation comes back as a success', async () => {
      const request = aBookingRequest({
        startsAt: '2026-11-04T10:00:00.000Z',
        format: 'video',
        phone: null,
        company: null,
        website: '',
      });
      const result = firstValueFrom(gateway.createBooking(request));

      const sent = http.expectOne(`${BOOKING}/bookings`);
      sent.flush(
        aBookingConfirmationDto({
          id: BOOKING_ID,
          startsAt: '2026-11-04T10:00:00.000Z',
          endsAt: '2026-11-04T10:30:00.000Z',
          format: 'video',
          videoUrl: 'https://meet.jit.si/nedellec-0123456789abcdef',
        }),
        { status: 201, statusText: 'Created' },
      );

      expect({
        method: sent.request.method,
        body: sent.request.body,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({
        method: 'POST',
        body: request,
        silent: true,
        result: {
          success: true,
          data: {
            id: BOOKING_ID,
            startsAt: '2026-11-04T10:00:00.000Z',
            endsAt: '2026-11-04T10:30:00.000Z',
            format: 'video',
            videoUrl: 'https://meet.jit.si/nedellec-0123456789abcdef',
          },
        },
      });
    });

    it('Given a phone booking When it is confirmed Then the phone number travels in the body and no video link comes back', async () => {
      const request = aBookingRequest({
        format: 'phone',
        phone: '+33 6 12 34 56 78',
        company: 'Atelier Dubois',
      });
      const result = firstValueFrom(gateway.createBooking(request));

      const sent = http.expectOne(`${BOOKING}/bookings`);
      sent.flush(aBookingConfirmationDto({ id: BOOKING_ID, format: 'phone', videoUrl: null }), {
        status: 201,
        statusText: 'Created',
      });

      expect({ body: sent.request.body, result: await result }).toEqual({
        body: request,
        result: {
          success: true,
          data: {
            id: BOOKING_ID,
            startsAt: '2026-10-19T07:00:00.000Z',
            endsAt: '2026-10-19T07:30:00.000Z',
            format: 'phone',
            videoUrl: null,
          },
        },
      });
    });

    it.each([
      { case: 'network down', reply: NETWORK_DOWN, reason: 'network' },
      { case: '400 validation', reply: coded(400, 'Bad Request'), reason: 'invalid' },
      { case: '409 slot_taken', reply: coded(409, 'slot_taken'), reason: 'slot-taken' },
      {
        case: '422 slot_unavailable',
        reply: coded(422, 'slot_unavailable'),
        reason: 'slot-unavailable',
      },
      {
        case: '422 booking_limit_reached',
        reply: coded(422, 'booking_limit_reached'),
        reason: 'limit-reached',
      },
      { case: '429 throttled', reply: coded(429, 'Too Many Requests'), reason: 'rate-limited' },
      { case: '500', reply: coded(500, 'Internal Server Error'), reason: 'server' },
      { case: '502 from nginx', reply: { status: 502, body: '<html>' }, reason: 'server' },
      { case: '503', reply: coded(503, 'Service Unavailable'), reason: 'server' },
      { case: '404 route not deployed', reply: coded(404, 'Not Found'), reason: 'server' },
    ])(
      'Given the API answers $case When the visitor books Then the failure reason is $reason',
      async ({ reply: answer, reason }) => {
        const result = firstValueFrom(gateway.createBooking(aBookingRequest()));

        reply(http.expectOne(`${BOOKING}/bookings`), answer);

        expect(await result).toEqual({ success: false, reason });
      },
    );
  });

  describe('visitor cancellation', () => {
    it('Given a valid token When the preview is asked Then the token goes in a silent POST body and the preview comes back as a success', async () => {
      const result = firstValueFrom(gateway.previewCancellation(TOKEN));

      const sent = http.expectOne(`${BOOKING}/bookings/cancel/preview`);
      sent.flush(
        aBookingCancelPreviewDto({
          startsAt: '2026-11-04T10:00:00.000Z',
          endsAt: '2026-11-04T10:30:00.000Z',
          format: 'phone',
          status: 'confirmed',
          cancellable: true,
        }),
      );

      expect({
        method: sent.request.method,
        body: sent.request.body,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({
        method: 'POST',
        body: { token: TOKEN },
        silent: true,
        result: {
          success: true,
          data: {
            startsAt: '2026-11-04T10:00:00.000Z',
            endsAt: '2026-11-04T10:30:00.000Z',
            format: 'phone',
            status: 'confirmed',
            cancellable: true,
          },
        },
      });
    });

    it('Given a valid token When the visitor confirms Then the token goes in a silent POST body and the cancellation succeeds', async () => {
      const result = firstValueFrom(gateway.cancelBooking(TOKEN));

      const sent = http.expectOne(`${BOOKING}/bookings/cancel`);
      sent.flush({ status: 'cancelled' });

      expect({
        method: sent.request.method,
        body: sent.request.body,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({
        method: 'POST',
        body: { token: TOKEN },
        silent: true,
        result: { success: true, data: null },
      });
    });

    it.each([
      {
        case: '404 booking_not_found',
        reply: coded(404, 'booking_not_found'),
        reason: 'not-found',
      },
      { case: '400 malformed token', reply: coded(400, 'Bad Request'), reason: 'not-found' },
      { case: 'network down', reply: NETWORK_DOWN, reason: 'network' },
      { case: '500', reply: coded(500, 'Internal Server Error'), reason: 'server' },
    ])(
      'Given the API answers $case When the preview is asked Then the failure reason is $reason',
      async ({ reply: answer, reason }) => {
        const result = firstValueFrom(gateway.previewCancellation(TOKEN));

        reply(http.expectOne(`${BOOKING}/bookings/cancel/preview`), answer);

        expect(await result).toEqual({ success: false, reason });
      },
    );

    it.each([
      {
        case: '404 booking_not_found',
        reply: coded(404, 'booking_not_found'),
        reason: 'not-found',
      },
      { case: '409 cancel_too_late', reply: coded(409, 'cancel_too_late'), reason: 'too-late' },
      { case: '400 malformed token', reply: coded(400, 'Bad Request'), reason: 'not-found' },
      { case: 'network down', reply: NETWORK_DOWN, reason: 'network' },
      { case: '503', reply: coded(503, 'Service Unavailable'), reason: 'server' },
    ])(
      'Given the API answers $case When the visitor cancels Then the failure reason is $reason',
      async ({ reply: answer, reason }) => {
        const result = firstValueFrom(gateway.cancelBooking(TOKEN));

        reply(http.expectOne(`${BOOKING}/bookings/cancel`), answer);

        expect(await result).toEqual({ success: false, reason });
      },
    );
  });

  describe('admin reads', () => {
    it.each([
      { scope: 'upcoming' as const },
      { scope: 'past' as const },
      { scope: 'archived' as const },
    ])(
      'Given the $scope scope When the admin lists bookings Then a silent GET carries the scope and yields the adapted bookings',
      async ({ scope }) => {
        const result = firstValueFrom(gateway.getBookings(scope));

        const request = http.expectOne(`${BOOKING}/bookings?scope=${scope}`);
        request.flush({
          data: [
            Object.assign(anAdminBookingDto({ id: BOOKING_ID, name: 'Léa Dubois' }), {
              cancelTokenHash: 'f'.repeat(64),
            }),
          ],
        });

        expect({
          method: request.request.method,
          silent: request.request.context.get(SKIP_ERROR_TOAST),
          bookings: await result,
        }).toEqual({
          method: 'GET',
          silent: true,
          bookings: [
            {
              id: BOOKING_ID,
              startsAt: '2026-10-19T07:00:00.000Z',
              endsAt: '2026-10-19T07:30:00.000Z',
              name: 'Léa Dubois',
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
            },
          ],
        });
      },
    );

    it('Given weekly rules When the admin reads them Then a silent GET yields the rules from the data envelope', async () => {
      const result = firstValueFrom(gateway.getAvailabilityRules());

      const request = http.expectOne(`${BOOKING}/availability/rules`);
      request.flush({
        data: [
          anAvailabilityRuleDto({ weekday: 2, startMinute: 600, endMinute: 720 }),
          anAvailabilityRuleDto({ weekday: 4, startMinute: 840, endMinute: 1080 }),
        ],
      });

      expect({
        method: request.request.method,
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        rules: await result,
      }).toEqual({
        method: 'GET',
        silent: true,
        rules: [
          { weekday: 2, startMinute: 600, endMinute: 720 },
          { weekday: 4, startMinute: 840, endMinute: 1080 },
        ],
      });
    });

    it('Given upcoming closures When the admin reads them Then a silent GET yields the closures from the data envelope', async () => {
      const result = firstValueFrom(gateway.getClosures());

      const request = http.expectOne(`${BOOKING}/availability/closures`);
      request.flush({
        data: [anAvailabilityClosureDto({ id: CLOSURE_ID, reason: null })],
      });

      expect({
        method: request.request.method,
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        closures: await result,
      }).toEqual({
        method: 'GET',
        silent: true,
        closures: [{ id: CLOSURE_ID, startsOn: '2026-12-24', endsOn: '2027-01-01', reason: null }],
      });
    });

    it.each([
      {
        read: 'the free slots',
        call: (target: HttpBookingGateway): Observable<unknown> => target.getSlots(),
        url: `${BOOKING}/slots`,
      },
      {
        read: 'the bookings',
        call: (target: HttpBookingGateway): Observable<unknown> => target.getBookings('upcoming'),
        url: `${BOOKING}/bookings?scope=upcoming`,
      },
      {
        read: 'the weekly rules',
        call: (target: HttpBookingGateway): Observable<unknown> => target.getAvailabilityRules(),
        url: `${BOOKING}/availability/rules`,
      },
      {
        read: 'the closures',
        call: (target: HttpBookingGateway): Observable<unknown> => target.getClosures(),
        url: `${BOOKING}/availability/closures`,
      },
    ])(
      'Given the API answers 500 When reading $read Then the error reaches the caller instead of an empty list',
      async ({ call, url }) => {
        const outcome = settled(call(gateway));

        reply(http.expectOne(url), coded(500, 'Internal Server Error'));

        expect(await outcome).toBe('error');
      },
    );
  });

  describe('upcoming count', () => {
    const COUNT_URL = `${BOOKING}/bookings/upcoming-count`;

    it('Given confirmed bookings ahead When the count is read Then a silent GET yields the bare number', async () => {
      const result = firstValueFrom(gateway.getUpcomingCount());

      const request = http.expectOne(COUNT_URL);
      request.flush({ count: 3 });

      expect({
        method: request.request.method,
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        count: await result,
      }).toEqual({ method: 'GET', silent: true, count: 3 });
    });

    it('Given two simultaneous readers When the count is read Then one request serves both', () => {
      const seen: number[] = [];
      const first = gateway.getUpcomingCount().subscribe((count) => seen.push(count));
      const second = gateway.getUpcomingCount().subscribe((count) => seen.push(count));

      http.expectOne(COUNT_URL).flush({ count: 2 });

      expect(seen).toEqual([2, 2]);
      first.unsubscribe();
      second.unsubscribe();
    });

    it('Given a reader of the count When the count is invalidated Then it is fetched again and the reader sees the new value', () => {
      const seen: number[] = [];
      const reader = gateway.getUpcomingCount().subscribe((count) => seen.push(count));
      http.expectOne(COUNT_URL).flush({ count: 2 });

      gateway.invalidateUpcomingCount();
      http.expectOne(COUNT_URL).flush({ count: 1 });

      expect(seen).toEqual([2, 1]);
      reader.unsubscribe();
    });

    it('Given the count failed When a new reader comes Then the failure is not cached and the request is sent again', async () => {
      const failed = settled(gateway.getUpcomingCount());
      reply(http.expectOne(COUNT_URL), coded(500, 'Error'));
      http.match(COUNT_URL).forEach((retry) => reply(retry, coded(500, 'Error')));
      const first = await failed;

      const next = settled(gateway.getUpcomingCount());
      const relaunched = http.match(COUNT_URL);
      relaunched.forEach((request) => request.flush({ count: 4 }));

      expect({ first, relaunched: relaunched.length, next: await next }).toEqual({
        first: 'error',
        relaunched: 1,
        next: 4,
      });
    });
  });

  describe('admin writes', () => {
    it('Given a booking ahead When the owner cancels it with a reason Then a silent PATCH carries the reason and the updated booking comes back', async () => {
      const result = firstValueFrom(gateway.cancelBookingAsOwner(BOOKING_ID, 'Imprévu.'));

      const sent = http.expectOne(`${BOOKING}/bookings/${BOOKING_ID}/cancel`);
      sent.flush(
        anAdminBookingDto({
          id: BOOKING_ID,
          status: 'cancelled',
          cancelledAt: '2026-10-14T09:00:00.000Z',
          cancelledBy: 'owner',
          cancelReason: 'Imprévu.',
        }),
      );

      expect({
        method: sent.request.method,
        body: sent.request.body,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({
        method: 'PATCH',
        body: { reason: 'Imprévu.' },
        silent: true,
        result: {
          success: true,
          data: {
            id: BOOKING_ID,
            startsAt: '2026-10-19T07:00:00.000Z',
            endsAt: '2026-10-19T07:30:00.000Z',
            name: 'Camille Martin',
            email: 'camille@example.com',
            phone: null,
            company: null,
            message: 'Refonte d’une application Angular.',
            format: 'video',
            videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
            status: 'cancelled',
            cancelledAt: '2026-10-14T09:00:00.000Z',
            cancelledBy: 'owner',
            cancelReason: 'Imprévu.',
            reminderSentAt: null,
            createdAt: '2026-10-13T09:00:00.000Z',
          },
        },
      });
    });

    it('Given new weekly rules When the admin saves them Then a silent PUT wraps them in rules and the stored rules come back', async () => {
      const rules = [
        anAvailabilityRule({ weekday: 2, startMinute: 600, endMinute: 720 }),
        anAvailabilityRule({ weekday: 4, startMinute: 840, endMinute: 1080 }),
      ];
      const result = firstValueFrom(gateway.replaceAvailabilityRules(rules));

      const sent = http.expectOne(`${BOOKING}/availability/rules`);
      sent.flush({
        data: [
          anAvailabilityRuleDto({ weekday: 2, startMinute: 600, endMinute: 720 }),
          anAvailabilityRuleDto({ weekday: 4, startMinute: 840, endMinute: 1080 }),
        ],
      });

      expect({
        method: sent.request.method,
        body: sent.request.body,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({
        method: 'PUT',
        body: { rules },
        silent: true,
        result: {
          success: true,
          data: [
            { weekday: 2, startMinute: 600, endMinute: 720 },
            { weekday: 4, startMinute: 840, endMinute: 1080 },
          ],
        },
      });
    });

    it('Given a closure to add When the admin creates it Then a silent POST carries its dates and reason and the stored closure comes back', async () => {
      const closure = anAvailabilityClosure({
        startsOn: '2026-12-24',
        endsOn: '2027-01-01',
        reason: 'Congés',
      });
      const { startsOn, endsOn, reason } = closure;
      const result = firstValueFrom(gateway.createClosure({ startsOn, endsOn, reason }));

      const sent = http.expectOne(`${BOOKING}/availability/closures`);
      sent.flush(anAvailabilityClosureDto({ id: CLOSURE_ID, startsOn, endsOn, reason }), {
        status: 201,
        statusText: 'Created',
      });

      expect({
        method: sent.request.method,
        body: sent.request.body,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({
        method: 'POST',
        body: { startsOn: '2026-12-24', endsOn: '2027-01-01', reason: 'Congés' },
        silent: true,
        result: {
          success: true,
          data: { id: CLOSURE_ID, startsOn: '2026-12-24', endsOn: '2027-01-01', reason: 'Congés' },
        },
      });
    });

    it('Given an existing closure When the admin deletes it Then a silent DELETE targets it and succeeds', async () => {
      const result = firstValueFrom(gateway.deleteClosure(CLOSURE_ID));

      const sent = http.expectOne(`${BOOKING}/availability/closures/${CLOSURE_ID}`);
      sent.flush(null, { status: 204, statusText: 'No Content' });

      expect({
        method: sent.request.method,
        silent: sent.request.context.get(SKIP_ERROR_TOAST),
        result: await result,
      }).toEqual({ method: 'DELETE', silent: true, result: { success: true, data: null } });
    });

    const cancelAsOwner = (target: HttpBookingGateway): Observable<unknown> =>
      target.cancelBookingAsOwner(BOOKING_ID, null);
    const replaceRules = (target: HttpBookingGateway): Observable<unknown> =>
      target.replaceAvailabilityRules([anAvailabilityRule()]);
    const createClosure = (target: HttpBookingGateway): Observable<unknown> =>
      target.createClosure({ startsOn: '2026-12-24', endsOn: '2026-12-26', reason: null });
    const deleteClosure = (target: HttpBookingGateway): Observable<unknown> =>
      target.deleteClosure(CLOSURE_ID);

    it.each([
      {
        write: 'owner cancel',
        case: '404 booking_not_found',
        call: cancelAsOwner,
        url: `${BOOKING}/bookings/${BOOKING_ID}/cancel`,
        reply: coded(404, 'booking_not_found'),
        reason: 'not-found',
      },
      {
        write: 'owner cancel',
        case: '409 cancel_too_late',
        call: cancelAsOwner,
        url: `${BOOKING}/bookings/${BOOKING_ID}/cancel`,
        reply: coded(409, 'cancel_too_late'),
        reason: 'too-late',
      },
      {
        write: 'owner cancel',
        case: 'network down',
        call: cancelAsOwner,
        url: `${BOOKING}/bookings/${BOOKING_ID}/cancel`,
        reply: NETWORK_DOWN,
        reason: 'network',
      },
      {
        write: 'rules',
        case: '400 rules_overlap',
        call: replaceRules,
        url: `${BOOKING}/availability/rules`,
        reply: coded(400, 'rules_overlap'),
        reason: 'overlap',
      },
      {
        write: 'rules',
        case: '400 validation',
        call: replaceRules,
        url: `${BOOKING}/availability/rules`,
        reply: coded(400, 'Bad Request'),
        reason: 'invalid',
      },
      {
        write: 'rules',
        case: '503',
        call: replaceRules,
        url: `${BOOKING}/availability/rules`,
        reply: coded(503, 'Service Unavailable'),
        reason: 'server',
      },
      {
        write: 'closure creation',
        case: '400 end before start',
        call: createClosure,
        url: `${BOOKING}/availability/closures`,
        reply: coded(400, 'Bad Request'),
        reason: 'invalid',
      },
      {
        write: 'closure creation',
        case: 'network down',
        call: createClosure,
        url: `${BOOKING}/availability/closures`,
        reply: NETWORK_DOWN,
        reason: 'network',
      },
      {
        write: 'closure deletion',
        case: '404',
        call: deleteClosure,
        url: `${BOOKING}/availability/closures/${CLOSURE_ID}`,
        reply: coded(404, 'Not Found'),
        reason: 'not-found',
      },
      {
        write: 'closure deletion',
        case: '500',
        call: deleteClosure,
        url: `${BOOKING}/availability/closures/${CLOSURE_ID}`,
        reply: coded(500, 'Internal Server Error'),
        reason: 'server',
      },
    ])(
      'Given the API answers $case When the admin writes ($write) Then the failure reason is $reason',
      async ({ call, url, reply: answer, reason }) => {
        const result = firstValueFrom(call(gateway));

        reply(http.expectOne(url), answer);

        expect(await result).toEqual({ success: false, reason });
      },
    );
  });

  describe('availability calendar', () => {
    const CALENDAR_URL = `${BOOKING}/availability/calendar`;
    const DAY_URL = `${BOOKING}/availability/days/2026-11-12`;
    const SETTINGS_URL = `${BOOKING}/availability/settings`;

    it('Given no month is asked When the admin reads the calendar Then a silent GET without query yields the resolved current month', async () => {
      const result = firstValueFrom(gateway.getAvailabilityCalendar(null));

      const request = http.expectOne(CALENDAR_URL);
      request.flush(
        aCalendarMonthDto({
          month: '2026-11',
          today: '2026-11-10',
          previousMonth: null,
          nextMonth: '2026-12',
          closePublicHolidays: true,
          days: [
            aCalendarDayDto({ date: '2026-11-09', state: 'past', slotCount: 4 }),
            aCalendarDayDto({
              date: '2026-11-11',
              state: 'holiday',
              holiday: 'Armistice 1918',
              slotCount: 4,
            }),
          ],
        }),
      );

      expect({
        method: request.request.method,
        params: request.request.params.keys(),
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        month: await result,
      }).toEqual({
        method: 'GET',
        params: [],
        silent: true,
        month: {
          month: '2026-11',
          today: '2026-11-10',
          previousMonth: null,
          nextMonth: '2026-12',
          closePublicHolidays: true,
          days: [
            { date: '2026-11-09', state: 'past', holiday: null, slotCount: 4, closure: null },
            {
              date: '2026-11-11',
              state: 'holiday',
              holiday: 'Armistice 1918',
              slotCount: 4,
              closure: null,
            },
          ],
        },
      });
    });

    it('Given a month is asked When the admin reads the calendar Then the month travels as the only query parameter', async () => {
      const result = firstValueFrom(gateway.getAvailabilityCalendar('2027-02'));

      const request = http.expectOne(`${CALENDAR_URL}?month=2027-02`);
      request.flush(
        aCalendarMonthDto({
          month: '2027-02',
          previousMonth: '2027-01',
          nextMonth: '2027-03',
          closePublicHolidays: false,
          days: [aCalendarDayDto({ date: '2027-02-01', state: 'open', slotCount: 2 })],
        }),
      );

      expect({
        method: request.request.method,
        params: request.request.params.keys(),
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        month: await result,
      }).toEqual({
        method: 'GET',
        params: ['month'],
        silent: true,
        month: {
          month: '2027-02',
          today: '2026-11-10',
          previousMonth: '2027-01',
          nextMonth: '2027-03',
          closePublicHolidays: false,
          days: [{ date: '2027-02-01', state: 'open', holiday: null, slotCount: 2, closure: null }],
        },
      });
    });

    it.each([
      { case: '500', reply: coded(500, 'Internal Server Error') },
      { case: '400 month_out_of_range', reply: coded(400, 'month_out_of_range') },
      { case: 'network down', reply: NETWORK_DOWN },
    ])(
      'Given the API answers $case When the admin reads the calendar Then the error reaches the caller',
      async ({ reply: answer }) => {
        const outcome = settled(gateway.getAvailabilityCalendar('2027-12'));

        reply(http.expectOne(`${CALENDAR_URL}?month=2027-12`), answer);

        expect(await outcome).toBe('error');
      },
    );

    it.each([
      { open: false, state: 'closed' as const, holiday: null },
      { open: true, state: 'open' as const, holiday: 'Armistice 1918' },
    ])(
      'Given a wished open state $open When the admin writes the day Then a silent PUT carries it and the resolved day comes back',
      async ({ open, state, holiday }) => {
        const result = firstValueFrom(gateway.setDayOpen('2026-11-12', open));

        const sent = http.expectOne(DAY_URL);
        sent.flush(aCalendarDayDto({ date: '2026-11-12', state, holiday, slotCount: 4 }));

        expect({
          method: sent.request.method,
          body: sent.request.body,
          silent: sent.request.context.get(SKIP_ERROR_TOAST),
          result: await result,
        }).toEqual({
          method: 'PUT',
          body: { open },
          silent: true,
          result: {
            success: true,
            data: { date: '2026-11-12', state, holiday, slotCount: 4, closure: null },
          },
        });
      },
    );

    it.each([{ value: false }, { value: true }])(
      'Given the holiday setting $value When the admin saves it Then a silent PUT carries it and the stored value comes back',
      async ({ value }) => {
        const result = firstValueFrom(gateway.setClosePublicHolidays(value));

        const sent = http.expectOne(SETTINGS_URL);
        sent.flush({ closePublicHolidays: value });

        expect({
          method: sent.request.method,
          body: sent.request.body,
          silent: sent.request.context.get(SKIP_ERROR_TOAST),
          result: await result,
        }).toEqual({
          method: 'PUT',
          body: { closePublicHolidays: value },
          silent: true,
          result: { success: true, data: value },
        });
      },
    );

    const setDay = (target: HttpBookingGateway): Observable<unknown> =>
      target.setDayOpen('2026-11-12', false);
    const setHolidays = (target: HttpBookingGateway): Observable<unknown> =>
      target.setClosePublicHolidays(false);

    it.each([
      {
        write: 'day',
        case: '422 day_in_past',
        call: setDay,
        url: DAY_URL,
        reply: coded(422, 'day_in_past'),
        reason: 'day-past',
      },
      {
        write: 'day',
        case: '409 day_in_closure',
        call: setDay,
        url: DAY_URL,
        reply: coded(409, 'day_in_closure'),
        reason: 'day-in-closure',
      },
      {
        write: 'day',
        case: '422 day_out_of_range',
        call: setDay,
        url: DAY_URL,
        reply: coded(422, 'day_out_of_range'),
        reason: 'invalid',
      },
      {
        write: 'day',
        case: '400 validation',
        call: setDay,
        url: DAY_URL,
        reply: coded(400, 'Bad Request'),
        reason: 'invalid',
      },
      {
        write: 'day',
        case: 'network down',
        call: setDay,
        url: DAY_URL,
        reply: NETWORK_DOWN,
        reason: 'network',
      },
      {
        write: 'day',
        case: '500',
        call: setDay,
        url: DAY_URL,
        reply: coded(500, 'Internal Server Error'),
        reason: 'server',
      },
      {
        write: 'holiday setting',
        case: '400 validation',
        call: setHolidays,
        url: SETTINGS_URL,
        reply: coded(400, 'Bad Request'),
        reason: 'invalid',
      },
      {
        write: 'holiday setting',
        case: 'network down',
        call: setHolidays,
        url: SETTINGS_URL,
        reply: NETWORK_DOWN,
        reason: 'network',
      },
      {
        write: 'holiday setting',
        case: '503',
        call: setHolidays,
        url: SETTINGS_URL,
        reply: coded(503, 'Service Unavailable'),
        reason: 'server',
      },
    ])(
      'Given the API answers $case When the admin writes the calendar ($write) Then the failure reason is $reason',
      async ({ call, url, reply: answer, reason }) => {
        const result = firstValueFrom(call(gateway));

        reply(http.expectOne(url), answer);

        expect(await result).toEqual({ success: false, reason });
      },
    );
  });
});

describe('HttpBookingGateway calendar subscription', () => {
  const SUBSCRIPTION_URL = `${BOOKING}/feed-subscription`;
  const LINK_BASE = 'https://api.example.test/api';
  const FEED_TOKEN = 'a'.repeat(43);
  const FEED_URL = `${LINK_BASE}/booking/feed/${FEED_TOKEN}.ics`;
  let http: HttpTestingController;

  function gatewayLinkedTo(linkBase: string): HttpBookingGateway {
    TestBed.configureTestingModule({
      providers: [
        HttpBookingGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: API_LINK_BASE_URL, useValue: linkBase },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(HttpBookingGateway);
  }

  afterEach(() => {
    http.verify();
  });

  it.each([
    {
      status: 'unconfigured',
      body: { status: 'unconfigured' },
      expected: { kind: 'unconfigured' },
    },
    { status: 'none', body: { status: 'none' }, expected: { kind: 'none' } },
    {
      status: 'active',
      body: aBookingFeedSubscriptionDto({
        token: FEED_TOKEN,
        createdAt: '2026-10-15T08:32:00.000Z',
      }),
      expected: { kind: 'active', url: FEED_URL, createdAt: '2026-10-15T08:32:00.000Z' },
    },
  ])(
    'Given the API answers $status When the admin reads the subscription Then a silent GET yields it with an absolute feed URL',
    async ({ body, expected }) => {
      const gateway = gatewayLinkedTo(LINK_BASE);
      const result = firstValueFrom(gateway.getFeedSubscription());

      const request = http.expectOne(SUBSCRIPTION_URL);
      request.flush(body);

      expect({
        method: request.request.method,
        silent: request.request.context.get(SKIP_ERROR_TOAST),
        subscription: await result,
      }).toEqual({ method: 'GET', silent: true, subscription: expected });
    },
  );

  it('Given a relative link base When an active subscription is read Then its feed URL is absolute on the document origin', async () => {
    const gateway = gatewayLinkedTo('/api');
    const origin = TestBed.inject(DOCUMENT).location.origin;
    const result = firstValueFrom(gateway.getFeedSubscription());

    http.expectOne(SUBSCRIPTION_URL).flush(aBookingFeedSubscriptionDto({ token: FEED_TOKEN }));

    expect(await result).toEqual({
      kind: 'active',
      url: `${origin}/api/booking/feed/${FEED_TOKEN}.ics`,
      createdAt: '2026-10-15T08:32:00.000Z',
    });
  });

  it.each([
    { case: '500', reply: coded(500, 'Internal Server Error') },
    { case: '401', reply: coded(401, 'Unauthorized') },
    { case: 'network down', reply: NETWORK_DOWN },
  ])(
    'Given the API answers $case When the admin reads the subscription Then the error reaches the caller',
    async ({ reply: answer }) => {
      const gateway = gatewayLinkedTo(LINK_BASE);
      const outcome = settled(gateway.getFeedSubscription());

      reply(http.expectOne(SUBSCRIPTION_URL), answer);

      expect(await outcome).toBe('error');
    },
  );

  it('Given a configured API When the admin creates the link Then a silent bodiless POST yields the new active subscription', async () => {
    const gateway = gatewayLinkedTo(LINK_BASE);
    const result = firstValueFrom(gateway.regenerateFeedSubscription());

    const sent = http.expectOne(SUBSCRIPTION_URL);
    sent.flush(
      aBookingFeedSubscriptionDto({ token: FEED_TOKEN, createdAt: '2026-11-02T14:00:00.000Z' }),
      { status: 201, statusText: 'Created' },
    );

    expect({
      method: sent.request.method,
      body: sent.request.body,
      silent: sent.request.context.get(SKIP_ERROR_TOAST),
      result: await result,
    }).toEqual({
      method: 'POST',
      body: null,
      silent: true,
      result: {
        success: true,
        data: { kind: 'active', url: FEED_URL, createdAt: '2026-11-02T14:00:00.000Z' },
      },
    });
  });

  it.each([
    { case: 'network down', reply: NETWORK_DOWN, reason: 'network' },
    {
      case: '409 feed_not_configured',
      reply: coded(409, 'feed_not_configured'),
      reason: 'not-configured',
    },
    { case: '500', reply: coded(500, 'Internal Server Error'), reason: 'server' },
    { case: '502 from nginx', reply: { status: 502, body: '<html>' }, reason: 'server' },
  ])(
    'Given the API answers $case When the admin creates the link Then the failure reason is $reason',
    async ({ reply: answer, reason }) => {
      const gateway = gatewayLinkedTo(LINK_BASE);
      const result = firstValueFrom(gateway.regenerateFeedSubscription());

      reply(http.expectOne(SUBSCRIPTION_URL), answer);

      expect(await result).toEqual({ success: false, reason });
    },
  );
});
