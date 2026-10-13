import { ApplicationRef, PLATFORM_ID, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEVER, defer, of, throwError, type Observable } from 'rxjs';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { BookingGateway } from '../../domain/gateways/booking.gateway';
import type {
  BookingFailureReason,
  BookingRequest,
  BookingSlot,
  BookingSubmission,
} from '../../domain/models/booking.model';
import {
  aBookingConfirmation,
  aBookingRequest,
  aBookingSlot,
} from '../../testing/booking-builders';
import { stubBookingGateway } from '../../testing/stub-booking-gateway';
import { BookingFlow } from './booking-flow';

const MONDAY_19_AT_9 = aBookingSlot({
  startsAt: '2026-10-19T07:00:00.000Z',
  endsAt: '2026-10-19T07:30:00.000Z',
});
const MONDAY_19_AT_930 = aBookingSlot({
  startsAt: '2026-10-19T07:30:00.000Z',
  endsAt: '2026-10-19T08:00:00.000Z',
});
const TUESDAY_20_AT_10 = aBookingSlot({
  startsAt: '2026-10-20T08:00:00.000Z',
  endsAt: '2026-10-20T08:30:00.000Z',
});
const MONDAY_26_AT_9 = aBookingSlot({
  startsAt: '2026-10-26T08:00:00.000Z',
  endsAt: '2026-10-26T08:30:00.000Z',
});
const TWO_WEEKS: readonly BookingSlot[] = [MONDAY_19_AT_9, TUESDAY_20_AT_10, MONDAY_26_AT_9];

type GetSlots = Mock<BookingGateway['getSlots']>;

const later = <T>(value: T): Observable<T> => defer(() => of(value));

const serving = (...responses: readonly Observable<readonly BookingSlot[]>[]): GetSlots => {
  let call = 0;
  return vi.fn<BookingGateway['getSlots']>(() => responses[Math.min(call++, responses.length - 1)]);
};

// Une ressource en attente (`NEVER`) garde l'application instable : la macro-tâche borne l'attente.
async function flush(): Promise<void> {
  TestBed.tick();
  await Promise.race([
    TestBed.inject(ApplicationRef).whenStable(),
    new Promise<void>((resolve) => setTimeout(resolve, 0)),
  ]);
  TestBed.tick();
}

async function openFlow(
  getSlots: GetSlots,
  extraProviders: Provider[] = [],
  gatewayOverrides: Partial<BookingGateway> = {},
): Promise<BookingFlow> {
  TestBed.configureTestingModule({
    providers: [
      BookingFlow,
      { provide: BookingGateway, useValue: stubBookingGateway({ getSlots, ...gatewayOverrides }) },
      { provide: AnalyticsGateway, useValue: stubAnalyticsGateway() },
      ...extraProviders,
    ],
  });
  const flow = TestBed.inject(BookingFlow);
  await flush();
  return flow;
}

const weekKeys = (flow: BookingFlow): readonly string[] => flow.weeks().map((week) => week.key);

type CreateBooking = Mock<BookingGateway['createBooking']>;
type TrackContactSubmit = Mock<AnalyticsGateway['trackContactSubmit']>;

const answering = (...results: readonly BookingSubmission[]): CreateBooking => {
  let call = 0;
  return vi.fn<BookingGateway['createBooking']>(() =>
    later(results[Math.min(call++, results.length - 1)]),
  );
};

const refusing = (reason: BookingFailureReason): BookingSubmission => ({ success: false, reason });

const CONFIRMED: BookingSubmission = { success: true, data: aBookingConfirmation() };

const PHONE_REQUEST = aBookingRequest({ format: 'phone', phone: '06 12 34 56 78' });

type SendingDoubles = {
  readonly getSlots?: GetSlots;
  readonly createBooking: CreateBooking;
};

type SendingFlow = {
  readonly flow: BookingFlow;
  readonly getSlots: GetSlots;
  readonly trackContactSubmit: TrackContactSubmit;
};

async function openSendingFlow({
  getSlots = serving(later(TWO_WEEKS)),
  createBooking,
}: SendingDoubles): Promise<SendingFlow> {
  const trackContactSubmit = vi.fn<AnalyticsGateway['trackContactSubmit']>();
  const flow = await openFlow(
    getSlots,
    [{ provide: AnalyticsGateway, useValue: stubAnalyticsGateway({ trackContactSubmit }) }],
    { createBooking },
  );
  return { flow, getSlots, trackContactSubmit };
}

function fillDetails(flow: BookingFlow, request: BookingRequest): void {
  flow.form.name().value.set(request.name);
  flow.form.email().value.set(request.email);
  flow.form.format().value.set(request.format);
  flow.form.phone().value.set(request.phone ?? '');
  flow.form.company().value.set(request.company ?? '');
  flow.form.message().value.set(request.message);
  flow.form.website().value.set(request.website);
}

function chooseMonday9(flow: BookingFlow): void {
  flow.selectDay('2026-10-19');
  flow.form.startsAt().value.set(MONDAY_19_AT_9.startsAt);
}

async function send(flow: BookingFlow): Promise<void> {
  await flow.submitBooking();
  await flush();
}

const kinds = (state: { errors: () => readonly { kind: string }[] }): readonly string[] =>
  state.errors().map((error) => error.kind);

describe('BookingFlow', () => {
  describe('loading the free slots', () => {
    it('Given the page is prerendered on the server When the flow starts Then the slots are never requested and the flow stays loading', async () => {
      const getSlots = serving(later(TWO_WEEKS));

      const flow = await openFlow(getSlots, [{ provide: PLATFORM_ID, useValue: 'server' }]);

      expect({
        calls: getSlots.mock.calls.length,
        state: flow.state(),
        weeks: flow.weeks(),
      }).toEqual({
        calls: 0,
        state: 'loading',
        weeks: [],
      });
    });

    it('Given the slots are on their way When the flow starts in the browser Then it is loading after one request', async () => {
      const getSlots = serving(NEVER);

      const flow = await openFlow(getSlots);

      expect({ calls: getSlots.mock.calls.length, state: flow.state() }).toEqual({
        calls: 1,
        state: 'loading',
      });
    });

    it('Given no free slot When loaded Then the flow is empty', async () => {
      const flow = await openFlow(serving(later([])));

      expect({ state: flow.state(), week: flow.currentWeek() }).toEqual({
        state: 'empty',
        week: null,
      });
    });

    it('Given free slots over two weeks When loaded Then the flow is ready on the first week', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));

      expect({
        state: flow.state(),
        weeks: weekKeys(flow),
        current: flow.currentWeek()?.label,
        days: flow.currentWeek()?.days.map((day) => day.label),
      }).toEqual({
        state: 'ready',
        weeks: ['2026-10-19', '2026-10-26'],
        current: 'Semaine du 19 octobre',
        days: ['lundi 19 octobre', 'mardi 20 octobre'],
      });
    });

    it('Given the slots failed to load When the visitor retries Then a second request brings the flow to ready', async () => {
      const getSlots = serving(
        throwError(() => new Error('down')),
        later(TWO_WEEKS),
      );
      const flow = await openFlow(getSlots);
      const failed = flow.state();

      flow.reloadSlots();
      await flush();

      expect({ failed, calls: getSlots.mock.calls.length, state: flow.state() }).toEqual({
        failed: 'error',
        calls: 2,
        state: 'ready',
      });
    });
  });

  describe('week navigation', () => {
    it('Given two weeks When the visitor moves forward then back Then the shown week and both bounds follow', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));
      const bounds = (): readonly [string | undefined, boolean, boolean] => [
        flow.currentWeek()?.key,
        flow.hasPreviousWeek(),
        flow.hasNextWeek(),
      ];
      const atStart = bounds();

      flow.showNextWeek();
      const atEnd = bounds();
      flow.showPreviousWeek();

      expect([atStart, atEnd, bounds()]).toEqual([
        ['2026-10-19', false, true],
        ['2026-10-26', true, false],
        ['2026-10-19', false, true],
      ]);
    });

    it('Given the last week is shown When the visitor asks for the next one Then the last week stays shown', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));

      flow.showNextWeek();
      flow.showNextWeek();

      expect(flow.currentWeek()?.key).toBe('2026-10-26');
    });

    it('Given the first week is shown When the visitor asks for the previous one Then the first week stays shown', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));

      flow.showNextWeek();
      flow.showPreviousWeek();
      flow.showPreviousWeek();

      expect(flow.currentWeek()?.key).toBe('2026-10-19');
    });

    it('Given a day and a time are chosen When the visitor moves to the next week and back Then both stay chosen', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));
      flow.selectDay('2026-10-19');
      flow.form.startsAt().value.set(MONDAY_19_AT_9.startsAt);

      flow.showNextWeek();
      const onNextWeek = [
        flow.currentWeek()?.key,
        flow.selectedDate(),
        flow.form.startsAt().value(),
      ];
      flow.showPreviousWeek();

      expect({
        onNextWeek,
        back: [flow.selectedDate(), flow.form.startsAt().value()],
      }).toEqual({
        onNextWeek: ['2026-10-26', '2026-10-19', MONDAY_19_AT_9.startsAt],
        back: ['2026-10-19', MONDAY_19_AT_9.startsAt],
      });
    });

    it('Given the second week is shown When a reload leaves a single week Then the shown week falls back to it', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS), later([MONDAY_19_AT_9])));
      flow.showNextWeek();

      flow.reloadSlots();
      await flush();

      expect({ week: flow.currentWeek()?.key, next: flow.hasNextWeek() }).toEqual({
        week: '2026-10-19',
        next: false,
      });
    });
  });

  describe('day and time selection', () => {
    it('Given nothing chosen yet When the visitor picks a day Then that day is selected with its own times and no time', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));
      const before = [flow.selectedDate(), flow.selectedDay()];

      flow.selectDay('2026-10-20');

      expect({
        before,
        date: flow.selectedDate(),
        label: flow.selectedDay()?.label,
        times: flow.selectedDay()?.slots.map((slot) => slot.timeLabel),
        time: flow.form.startsAt().value(),
      }).toEqual({
        before: [null, null],
        date: '2026-10-20',
        label: 'mardi 20 octobre',
        times: ['10:00'],
        time: '',
      });
    });

    it('Given a time is chosen When the visitor changes day Then the time is cleared', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));
      flow.selectDay('2026-10-19');
      flow.form.startsAt().value.set(MONDAY_19_AT_9.startsAt);
      const chosen = flow.form.startsAt().value();

      flow.selectDay('2026-10-20');

      expect({ chosen, after: flow.form.startsAt().value() }).toEqual({
        chosen: MONDAY_19_AT_9.startsAt,
        after: '',
      });
    });

    it('Given a chosen day vanishes from a reload When the slots come back Then neither a day nor a time is selected any more', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS), later([TUESDAY_20_AT_10])));
      flow.selectDay('2026-10-19');
      flow.form.startsAt().value.set(MONDAY_19_AT_9.startsAt);
      const before = [flow.selectedDate(), flow.form.startsAt().value()];

      flow.reloadSlots();
      await flush();

      expect({
        before,
        date: flow.selectedDate(),
        day: flow.selectedDay(),
        time: flow.form.startsAt().value(),
      }).toEqual({
        before: ['2026-10-19', MONDAY_19_AT_9.startsAt],
        date: null,
        day: null,
        time: '',
      });
    });

    it('Given only the chosen time vanishes from a reload When the slots come back Then the day stays selected and the time is cleared', async () => {
      const flow = await openFlow(
        serving(later(TWO_WEEKS), later([MONDAY_19_AT_930, TUESDAY_20_AT_10])),
      );
      flow.selectDay('2026-10-19');
      flow.form.startsAt().value.set(MONDAY_19_AT_9.startsAt);

      flow.reloadSlots();
      await flush();

      expect({
        date: flow.selectedDate(),
        times: flow.selectedDay()?.slots.map((slot) => slot.timeLabel),
        time: flow.form.startsAt().value(),
      }).toEqual({ date: '2026-10-19', times: ['09:30'], time: '' });
    });

    it('Given the chosen day and time survive a reload When the slots come back Then both stay selected', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS), later([TUESDAY_20_AT_10])));
      flow.selectDay('2026-10-20');
      flow.form.startsAt().value.set(TUESDAY_20_AT_10.startsAt);

      flow.reloadSlots();
      await flush();

      expect({ date: flow.selectedDate(), time: flow.form.startsAt().value() }).toEqual({
        date: '2026-10-20',
        time: TUESDAY_20_AT_10.startsAt,
      });
    });
  });

  describe('validating the booking details', () => {
    it('Given a fresh flow When nothing is entered Then the draft holds the defaults and only the time, name, email and message are required', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));

      expect({
        value: flow.form().value(),
        errors: {
          startsAt: kinds(flow.form.startsAt()),
          name: kinds(flow.form.name()),
          email: kinds(flow.form.email()),
          format: kinds(flow.form.format()),
          phone: kinds(flow.form.phone()),
          company: kinds(flow.form.company()),
          message: kinds(flow.form.message()),
          website: kinds(flow.form.website()),
        },
      }).toEqual({
        value: {
          startsAt: '',
          name: '',
          email: '',
          format: 'video',
          phone: '',
          company: '',
          message: '',
          website: '',
        },
        errors: {
          startsAt: ['required'],
          name: ['required'],
          email: ['required'],
          format: [],
          phone: [],
          company: [],
          message: ['required'],
          website: [],
        },
      });
    });

    it.each([
      { field: 'name', bound: 'two letters', accepted: 'Al', refused: 'A', kind: 'minLength' },
      {
        field: 'name',
        bound: '200 characters',
        accepted: 'a'.repeat(200),
        refused: 'a'.repeat(201),
        kind: 'maxLength',
      },
      {
        field: 'email',
        bound: 'an address shape',
        accepted: 'camille@example.com',
        refused: 'not-an-email',
        kind: 'pattern',
      },
      {
        field: 'email',
        bound: '320 characters',
        accepted: `${'a'.repeat(308)}@example.com`,
        refused: `${'a'.repeat(309)}@example.com`,
        kind: 'maxLength',
      },
      {
        field: 'phone',
        bound: 'six digits',
        accepted: '123456',
        refused: '12345',
        kind: 'pattern',
      },
      {
        field: 'phone',
        bound: 'digits and separators only',
        accepted: '06 12 34 56 78',
        refused: '06 12 ab 56 78',
        kind: 'pattern',
      },
      {
        field: 'company',
        bound: '200 characters',
        accepted: 'a'.repeat(200),
        refused: 'a'.repeat(201),
        kind: 'maxLength',
      },
      {
        field: 'message',
        bound: '10 characters',
        accepted: 'a'.repeat(10),
        refused: 'a'.repeat(9),
        kind: 'minLength',
      },
      {
        field: 'message',
        bound: '1000 characters',
        accepted: 'a'.repeat(1000),
        refused: 'a'.repeat(1001),
        kind: 'maxLength',
      },
    ] as const)(
      'Given a phone booking otherwise valid When $field crosses its bound of $bound Then it carries a $kind error past it only',
      async ({ field, accepted, refused, kind }) => {
        const flow = await openFlow(serving(later(TWO_WEEKS)));
        chooseMonday9(flow);
        fillDetails(flow, PHONE_REQUEST);
        const judge = (value: string): readonly [readonly string[], boolean] => {
          flow.form[field]().value.set(value);
          return [kinds(flow.form[field]()), flow.form().valid()];
        };

        expect([judge(accepted), judge(refused)]).toEqual([
          [[], true],
          [[kind], false],
        ]);
      },
    );

    it('Given a valid video booking without a phone When the visitor switches to a phone call and back Then the phone is required only while the call is by phone', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));
      chooseMonday9(flow);
      fillDetails(flow, aBookingRequest());
      const snapshot = (): readonly [readonly string[], boolean] => [
        kinds(flow.form.phone()),
        flow.form().valid(),
      ];
      const byVideo = snapshot();

      flow.form.format().value.set('phone');
      const byPhone = snapshot();
      flow.form.format().value.set('video');

      expect([byVideo, byPhone, snapshot()]).toEqual([
        [[], true],
        [['required'], false],
        [[], true],
      ]);
    });

    it.each(['+33 6 12 34 56 78', '06.12.34.56.78', '0612345678', '+44-20-7946-0958'])(
      'Given a phone booking When the number is %j Then the booking is valid, where an empty number is not',
      async (phone) => {
        const flow = await openFlow(serving(later(TWO_WEEKS)));
        chooseMonday9(flow);
        fillDetails(flow, aBookingRequest({ format: 'phone', phone: '' }));
        const empty = [kinds(flow.form.phone()), flow.form().valid()];

        flow.form.phone().value.set(phone);

        expect({ empty, filled: [kinds(flow.form.phone()), flow.form().valid()] }).toEqual({
          empty: [['required'], false],
          filled: [[], true],
        });
      },
    );

    it('Given a malformed number When the call is by video Then it is ignored, though the same number is refused for a phone call', async () => {
      const flow = await openFlow(serving(later(TWO_WEEKS)));
      chooseMonday9(flow);
      fillDetails(flow, aBookingRequest({ phone: 'abc' }));
      const byVideo = [kinds(flow.form.phone()), flow.form().valid()];

      flow.form.format().value.set('phone');

      expect({ byVideo, byPhone: [kinds(flow.form.phone()), flow.form().valid()] }).toEqual({
        byVideo: [[], true],
        byPhone: [['pattern'], false],
      });
    });
  });

  describe('sending the booking', () => {
    it('Given nothing entered When the visitor submits Then nothing is sent and every required field is revealed', async () => {
      const createBooking = answering(CONFIRMED);
      const { flow } = await openSendingFlow({ createBooking });

      await send(flow);

      expect({
        calls: createBooking.mock.calls.length,
        outcome: flow.outcome(),
        touched: [flow.form.startsAt, flow.form.name, flow.form.email, flow.form.message].map(
          (field) => field().touched(),
        ),
      }).toEqual({ calls: 0, outcome: null, touched: [true, true, true, true] });
    });

    it('Given a video booking with a leftover phone and no company When sent Then the request carries no phone and no company', async () => {
      const createBooking = answering(CONFIRMED);
      const { flow } = await openSendingFlow({ createBooking });
      chooseMonday9(flow);
      fillDetails(flow, aBookingRequest());
      flow.form.phone().value.set('06 12 34 56 78');

      await send(flow);

      expect(createBooking.mock.calls).toEqual([[aBookingRequest()]]);
    });

    it('Given a phone booking with a company When sent Then the request carries the number and the company', async () => {
      const createBooking = answering(CONFIRMED);
      const { flow } = await openSendingFlow({ createBooking });
      const request = aBookingRequest({
        format: 'phone',
        phone: '06 12 34 56 78',
        company: 'Atelier Martin',
      });
      chooseMonday9(flow);
      fillDetails(flow, request);

      await send(flow);

      expect(createBooking.mock.calls).toEqual([[request]]);
    });

    it('Given a robot filled the hidden field When sent Then the request carries it untouched for the API to discard', async () => {
      const createBooking = answering(CONFIRMED);
      const { flow } = await openSendingFlow({ createBooking });
      const request = aBookingRequest({ website: 'https://spam.example' });
      chooseMonday9(flow);
      fillDetails(flow, request);

      await send(flow);

      expect(createBooking.mock.calls).toEqual([[request]]);
    });

    it('Given a valid booking When the API confirms it Then the outcome holds the confirmation and the email, and one booking submission is counted after the send', async () => {
      const createBooking = answering(CONFIRMED);
      const { flow, trackContactSubmit } = await openSendingFlow({ createBooking });
      chooseMonday9(flow);
      fillDetails(flow, aBookingRequest());

      await send(flow);

      expect({
        outcome: flow.outcome(),
        tracked: trackContactSubmit.mock.calls,
        sentFirst:
          createBooking.mock.invocationCallOrder[0] <
          (trackContactSubmit.mock.invocationCallOrder[0] ?? 0),
      }).toEqual({
        outcome: {
          kind: 'confirmed',
          confirmation: aBookingConfirmation(),
          email: 'camille@example.com',
        },
        tracked: [['booking']],
        sentFirst: true,
      });
    });

    it.each<BookingFailureReason>([
      'limit-reached',
      'rate-limited',
      'invalid',
      'network',
      'server',
    ])(
      'Given a valid booking When the API answers %s Then the outcome says so and the time and details stay as entered',
      async (reason) => {
        const createBooking = answering(refusing(reason));
        const { flow, getSlots, trackContactSubmit } = await openSendingFlow({ createBooking });
        chooseMonday9(flow);
        fillDetails(flow, PHONE_REQUEST);
        const entered = flow.form().value();

        await send(flow);

        expect({
          outcome: flow.outcome(),
          value: flow.form().value(),
          slotRequests: getSlots.mock.calls.length,
          tracked: trackContactSubmit.mock.calls.length,
        }).toEqual({
          outcome: { kind: 'failed', reason },
          value: entered,
          slotRequests: 1,
          tracked: 0,
        });
      },
    );

    it.each<BookingFailureReason>(['slot-taken', 'slot-unavailable'])(
      'Given a valid booking When the API answers %s Then the slots are reloaded, the time is cleared and the day and details are kept',
      async (reason) => {
        const createBooking = answering(refusing(reason));
        const { flow, getSlots, trackContactSubmit } = await openSendingFlow({
          getSlots: serving(later(TWO_WEEKS), later(TWO_WEEKS)),
          createBooking,
        });
        chooseMonday9(flow);
        fillDetails(flow, PHONE_REQUEST);
        const entered = flow.form().value();

        await send(flow);

        expect({
          outcome: flow.outcome(),
          value: flow.form().value(),
          date: flow.selectedDate(),
          slotRequests: getSlots.mock.calls.length,
          tracked: trackContactSubmit.mock.calls.length,
        }).toEqual({
          outcome: { kind: 'failed', reason },
          value: { ...entered, startsAt: '' },
          date: '2026-10-19',
          slotRequests: 2,
          tracked: 0,
        });
      },
    );

    it('Given the network failed once When the visitor sends again Then the booking is confirmed on the second request', async () => {
      const createBooking = answering(refusing('network'), CONFIRMED);
      const { flow } = await openSendingFlow({ createBooking });
      chooseMonday9(flow);
      fillDetails(flow, aBookingRequest());
      await send(flow);

      await send(flow);

      expect({ calls: createBooking.mock.calls.length, outcome: flow.outcome()?.kind }).toEqual({
        calls: 2,
        outcome: 'confirmed',
      });
    });

    it('Given a booking is on its way When the visitor submits again Then a single request is in flight', async () => {
      const createBooking = vi.fn<BookingGateway['createBooking']>(() => NEVER);
      const { flow } = await openSendingFlow({ createBooking });
      chooseMonday9(flow);
      fillDetails(flow, aBookingRequest());

      void flow.submitBooking();
      void flow.submitBooking();
      await flush();

      expect({
        calls: createBooking.mock.calls.length,
        submitting: flow.form().submitting(),
      }).toEqual({ calls: 1, submitting: true });
    });
  });
});
