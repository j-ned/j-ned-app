import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NEVER, Subject, defer, of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AdminBooking,
  BookingAdminFailure,
  BookingAdminResult,
  CalendarDay,
  CalendarMonth,
} from '@features/booking/domain/models/booking-admin.model';
import {
  aCalendarDay,
  anAdminBooking,
  anApiErrorBody,
} from '@features/booking/testing/booking-builders';
import { stubBookingGateway } from '@features/booking/testing/stub-booking-gateway';
import type { ToastMessage } from '@shared/ui/toast.types';
import type { LoadState } from '@shared/ui/load-state';
import type { CalendarCell } from '../../application/calendar-month-view';
import { aCalendarMonthOf } from '../../application/testing/calendar-month-builder';
import { AvailabilityCalendar } from './availability-calendar';

const NOVEMBER = aCalendarMonthOf('2026-11');
const DECEMBER = aCalendarMonthOf('2026-12', { previousMonth: '2026-11', nextMonth: '2027-01' });

type Calendar = {
  readonly calendar: AvailabilityCalendar;
  readonly read: Mock<BookingGateway['getAvailabilityCalendar']>;
};

const byMonth = (month: string | null): Observable<CalendarMonth> =>
  defer(() => of(month === '2026-12' ? DECEMBER : NOVEMBER));

async function flush(): Promise<void> {
  for (let pass = 0; pass < 2; pass++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  TestBed.tick();
}

async function openCalendar(
  read: BookingGateway['getAvailabilityCalendar'] = byMonth,
): Promise<Calendar> {
  const spy = vi.fn<BookingGateway['getAvailabilityCalendar']>(read);
  TestBed.configureTestingModule({
    providers: [
      AvailabilityCalendar,
      { provide: BookingGateway, useValue: stubBookingGateway({ getAvailabilityCalendar: spy }) },
      { provide: ToastStore, useValue: { add: vi.fn<ToastStore['add']>() } },
    ],
  });
  const calendar = TestBed.inject(AvailabilityCalendar);
  await flush();
  return { calendar, read: spy };
}

type Shown = {
  readonly state: LoadState;
  readonly busy: boolean;
  readonly month: string | null;
  readonly label: string | null;
};

const shown = ({ calendar }: Calendar): Shown => ({
  state: calendar.state(),
  busy: calendar.busy(),
  month: calendar.view()?.month ?? null,
  label: calendar.view()?.label ?? null,
});

describe('AvailabilityCalendar: lecture du mois', () => {
  it('Given the screen opens When the calendar starts Then it reads the current month once, without naming it, and shows it ready', async () => {
    const opened = await openCalendar();

    expect({
      calls: opened.read.mock.calls,
      ...shown(opened),
      weeks: opened.calendar.view()?.weeks.length,
      focusDate: opened.calendar.focusDate(),
    }).toEqual({
      calls: [[null]],
      state: 'ready',
      busy: false,
      month: '2026-11',
      label: 'Novembre 2026',
      weeks: 6,
      focusDate: null,
    });
  });

  it('Given the month is still on its way When the calendar starts Then it is loading with nothing to show', async () => {
    const opened = await openCalendar(() => NEVER);

    expect(shown(opened)).toEqual({ state: 'loading', busy: false, month: null, label: null });
  });

  it('Given the month failed to load When the calendar starts Then it reports an error', async () => {
    const opened = await openCalendar(() => throwError(() => new Error('offline')));

    expect(shown(opened)).toEqual({ state: 'error', busy: false, month: null, label: null });
  });

  it('Given the month failed to load When it is reloaded Then the same month is read again and shown', async () => {
    let attempts = 0;
    const opened = await openCalendar((month) =>
      defer(() => {
        attempts += 1;
        return attempts === 1 ? throwError(() => new Error('offline')) : byMonth(month);
      }),
    );

    opened.calendar.reload();
    await flush();

    expect({ calls: opened.read.mock.calls, ...shown(opened) }).toEqual({
      calls: [[null], [null]],
      state: 'ready',
      busy: false,
      month: '2026-11',
      label: 'Novembre 2026',
    });
  });
});

const answeredWith = (status: number, error: string): Observable<never> =>
  throwError(() => new HttpErrorResponse({ status, error: anApiErrorBody(status, error) }));

describe('AvailabilityCalendar: mois devenu passé', () => {
  it('Given November shown When October is asked and refused as out of range Then the current month is read again without naming it, shown, with nothing to focus', async () => {
    const opened = await openCalendar((month) =>
      month === '2026-10' ? answeredWith(400, 'month_out_of_range') : byMonth(month),
    );

    opened.calendar.goToMonth('2026-10', '2026-10-12');
    await flush();

    expect({
      calls: opened.read.mock.calls,
      ...shown(opened),
      focusDate: opened.calendar.focusDate(),
    }).toEqual({
      calls: [[null], ['2026-10'], [null]],
      state: 'ready',
      busy: false,
      month: '2026-11',
      label: 'Novembre 2026',
      focusDate: null,
    });
  });

  it('Given the fallback to the current month failed When it is reloaded Then the current month is read again, not the refused one', async () => {
    let currentReads = 0;
    const opened = await openCalendar((month) => {
      if (month === '2026-10') return answeredWith(400, 'month_out_of_range');
      return defer(() => {
        currentReads += 1;
        return currentReads === 2 ? throwError(() => new Error('offline')) : byMonth(month);
      });
    });

    opened.calendar.goToMonth('2026-10', '2026-10-12');
    await flush();
    const failed = opened.calendar.state();
    opened.calendar.reload();
    await flush();

    expect({ failed, calls: opened.read.mock.calls, ...shown(opened) }).toEqual({
      failed: 'error',
      calls: [[null], ['2026-10'], [null], [null]],
      state: 'ready',
      busy: false,
      month: '2026-11',
      label: 'Novembre 2026',
    });
  });

  it('Given December refused by a server error When it is reloaded Then December itself is read again', async () => {
    let decemberReads = 0;
    const opened = await openCalendar((month) =>
      defer(() => {
        if (month !== '2026-12') return byMonth(month);
        decemberReads += 1;
        return decemberReads === 1 ? answeredWith(500, 'Internal Server Error') : byMonth(month);
      }),
    );

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    const failed = opened.calendar.state();
    opened.calendar.reload();
    await flush();

    expect({ failed, calls: opened.read.mock.calls, month: shown(opened).month }).toEqual({
      failed: 'error',
      calls: [[null], ['2026-12'], ['2026-12']],
      month: '2026-12',
    });
  });

  it('Given the current month itself refused as out of range When the calendar starts Then it reports an error without reading again', async () => {
    const opened = await openCalendar(() => answeredWith(400, 'month_out_of_range'));

    expect({ calls: opened.read.mock.calls, state: opened.calendar.state() }).toEqual({
      calls: [[null]],
      state: 'error',
    });
  });
});

describe('AvailabilityCalendar: navigation', () => {
  it('Given November When December is asked with a day to focus Then December is read by name, shown, and that day is the one to focus', async () => {
    const opened = await openCalendar();

    opened.calendar.goToMonth('2026-12', '2026-12-12');
    await flush();

    expect({
      calls: opened.read.mock.calls,
      ...shown(opened),
      focusDate: opened.calendar.focusDate(),
    }).toEqual({
      calls: [[null], ['2026-12']],
      state: 'ready',
      busy: false,
      month: '2026-12',
      label: 'Décembre 2026',
      focusDate: '2026-12-12',
    });
  });

  it('Given November When December is asked without a day to focus Then nothing is to focus', async () => {
    const opened = await openCalendar();

    opened.calendar.goToMonth('2026-12', null);
    await flush();

    expect({
      month: opened.calendar.view()?.month,
      focusDate: opened.calendar.focusDate(),
    }).toEqual({ month: '2026-12', focusDate: null });
  });

  it('Given December on its way When it is not answered yet Then November stays shown, busy, never back to the loading placeholder, until December arrives', async () => {
    const december = new Subject<CalendarMonth>();
    const opened = await openCalendar((month) => (month === '2026-12' ? december : byMonth(month)));

    opened.calendar.goToMonth('2026-12', '2026-12-12');
    await flush();
    const meanwhile = shown(opened);
    december.next(DECEMBER);
    december.complete();
    await flush();

    expect({ meanwhile, after: shown(opened) }).toEqual({
      meanwhile: { state: 'ready', busy: true, month: '2026-11', label: 'Novembre 2026' },
      after: { state: 'ready', busy: false, month: '2026-12', label: 'Décembre 2026' },
    });
  });

  it('Given December shown When November is asked back Then it is read by name and shown', async () => {
    const opened = await openCalendar();

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    opened.calendar.goToMonth('2026-11', '2026-11-30');
    await flush();

    expect({
      calls: opened.read.mock.calls,
      month: opened.calendar.view()?.month,
      focusDate: opened.calendar.focusDate(),
    }).toEqual({
      calls: [[null], ['2026-12'], ['2026-11']],
      month: '2026-11',
      focusDate: '2026-11-30',
    });
  });

  it('Given December shown When it is reloaded Then December is read again by name', async () => {
    const opened = await openCalendar();

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    opened.calendar.reload();
    await flush();

    expect(opened.read.mock.calls).toEqual([[null], ['2026-12'], ['2026-12']]);
  });
});

type Writes = {
  readonly getAvailabilityCalendar?: BookingGateway['getAvailabilityCalendar'];
  readonly setDayOpen?: BookingGateway['setDayOpen'];
  readonly setClosePublicHolidays?: BookingGateway['setClosePublicHolidays'];
  readonly getBookings?: BookingGateway['getBookings'];
};

type Writing = {
  readonly calendar: AvailabilityCalendar;
  readonly read: Mock<BookingGateway['getAvailabilityCalendar']>;
  readonly setDayOpen: Mock<BookingGateway['setDayOpen']>;
  readonly setClosePublicHolidays: Mock<BookingGateway['setClosePublicHolidays']>;
  readonly getBookings: Mock<BookingGateway['getBookings']>;
  readonly toasts: () => readonly ToastMessage[];
};

type DayResult = BookingAdminResult<CalendarDay>;

const answered = (day: Partial<CalendarDay>): Observable<DayResult> =>
  defer(() => of({ success: true, data: aCalendarDay(day) } as const));

const refused = (reason: BookingAdminFailure): Observable<DayResult> =>
  defer(() => of({ success: false, reason } as const));

const resolvedLikeServer = (date: string, open: boolean): Observable<DayResult> =>
  answered({ date, state: open ? 'open' : 'closed' });

const acceptedSetting: BookingGateway['setClosePublicHolidays'] = (value) =>
  defer(() => of({ success: true, data: value } as const));

const noBookings: BookingGateway['getBookings'] = () => defer(() => of([]));

async function openWriting(writes: Writes = {}): Promise<Writing> {
  const read = vi.fn<BookingGateway['getAvailabilityCalendar']>(
    writes.getAvailabilityCalendar ?? byMonth,
  );
  const setDayOpen = vi.fn<BookingGateway['setDayOpen']>(writes.setDayOpen ?? resolvedLikeServer);
  const setClosePublicHolidays = vi.fn<BookingGateway['setClosePublicHolidays']>(
    writes.setClosePublicHolidays ?? acceptedSetting,
  );
  const getBookings = vi.fn<BookingGateway['getBookings']>(writes.getBookings ?? noBookings);
  const toast = vi.fn<ToastStore['add']>();
  TestBed.configureTestingModule({
    providers: [
      AvailabilityCalendar,
      {
        provide: BookingGateway,
        useValue: stubBookingGateway({
          getAvailabilityCalendar: read,
          setDayOpen,
          setClosePublicHolidays,
          getBookings,
        }),
      },
      { provide: ToastStore, useValue: { add: toast } },
    ],
  });
  const calendar = TestBed.inject(AvailabilityCalendar);
  await flush();
  return {
    calendar,
    read,
    setDayOpen,
    setClosePublicHolidays,
    getBookings,
    toasts: () => toast.mock.calls.map(([message]) => message),
  };
}

const novemberWith = (
  days: Readonly<Record<string, Partial<CalendarDay>>>,
): Observable<CalendarMonth> => defer(() => of(aCalendarMonthOf('2026-11', { days })));

const cellOn = (calendar: AvailabilityCalendar, date: string): CalendarCell | null =>
  calendar
    .view()
    ?.weeks.flat()
    .find((cell) => cell?.date === date) ?? null;

const stateOn = (calendar: AvailabilityCalendar, date: string): string | null =>
  cellOn(calendar, date)?.state ?? null;

describe('AvailabilityCalendar: fermer ou rouvrir un jour', () => {
  it.each<{
    state: CalendarDay['state'];
    holiday: string | null;
    slotCount: number;
    open: boolean;
  }>([
    { state: 'open', holiday: null, slotCount: 4, open: false },
    { state: 'empty', holiday: null, slotCount: 0, open: false },
    { state: 'closed', holiday: null, slotCount: 4, open: true },
    { state: 'holiday', holiday: 'Armistice 1918', slotCount: 4, open: true },
    { state: 'open', holiday: 'Armistice 1918', slotCount: 4, open: false },
  ])(
    'Given the 12th shown $state (holiday: $holiday) When it is toggled Then one write asks for open: $open',
    async ({ state, holiday, slotCount, open }) => {
      const opened = await openWriting({
        getAvailabilityCalendar: () =>
          novemberWith({ '2026-11-12': { state, holiday, slotCount } }),
      });

      opened.calendar.toggleDay('2026-11-12');
      await flush();

      expect(opened.setDayOpen.mock.calls).toEqual([['2026-11-12', open]]);
    },
  );

  it.each([
    { case: 'a past day', date: '2026-11-09' },
    { case: 'a day under a closure', date: '2026-11-25' },
    { case: 'a day outside the shown month', date: '2026-12-01' },
  ])('Given $case When it is toggled Then nothing is written', async ({ date }) => {
    const opened = await openWriting({
      getAvailabilityCalendar: () =>
        novemberWith({
          '2026-11-25': {
            state: 'closed-period',
            closure: { startsOn: '2026-11-24', endsOn: '2026-11-27', reason: 'Congés' },
          },
        }),
    });

    opened.calendar.toggleDay(date);
    await flush();

    expect({
      calls: opened.setDayOpen.mock.calls,
      pending: [...opened.calendar.pending()],
      announcement: opened.calendar.announcement(),
    }).toEqual({ calls: [], pending: [], announcement: '' });
  });

  it('Given an open 12th When it is toggled and the server answers it closed Then only that day is replaced by the answer, the month is not read again and the closing is announced without a toast', async () => {
    const opened = await openWriting();
    const before = opened.calendar.view();

    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect({
      day: {
        state: stateOn(opened.calendar, '2026-11-12'),
        label: cellOn(opened.calendar, '2026-11-12')?.label,
      },
      neighbour: stateOn(opened.calendar, '2026-11-13'),
      replaced: opened.calendar.view() !== before,
      reads: opened.read.mock.calls,
      pending: [...opened.calendar.pending()],
      announcement: opened.calendar.announcement(),
      toasts: opened.toasts(),
    }).toEqual({
      day: { state: 'closed', label: 'jeudi 12 novembre 2026, fermé' },
      neighbour: 'open',
      replaced: true,
      reads: [[null]],
      pending: [],
      announcement: 'Fermé : jeudi 12 novembre 2026.',
      toasts: [],
    });
  });

  it.each<{ from: Partial<CalendarDay>; answer: Partial<CalendarDay>; announcement: string }>([
    {
      from: { date: '2026-11-12', state: 'open' },
      answer: { date: '2026-11-12', state: 'closed' },
      announcement: 'Fermé : jeudi 12 novembre 2026.',
    },
    {
      from: { date: '2026-11-11', state: 'open', holiday: 'Armistice 1918' },
      answer: { date: '2026-11-11', state: 'holiday', holiday: 'Armistice 1918' },
      announcement: 'Fermé : mercredi 11 novembre 2026.',
    },
    {
      from: { date: '2026-11-11', state: 'holiday', holiday: 'Armistice 1918' },
      answer: { date: '2026-11-11', state: 'open', holiday: 'Armistice 1918', slotCount: 4 },
      announcement: 'Rouvert : mercredi 11 novembre 2026, 4 créneaux.',
    },
    {
      from: { date: '2026-11-12', state: 'closed' },
      answer: { date: '2026-11-12', state: 'open', slotCount: 1 },
      announcement: 'Rouvert : jeudi 12 novembre 2026, 1 créneau.',
    },
    {
      from: { date: '2026-11-15', state: 'closed', slotCount: 0 },
      answer: { date: '2026-11-15', state: 'empty', slotCount: 0 },
      announcement: 'Rouvert : dimanche 15 novembre 2026, aucun créneau.',
    },
  ])(
    'Given a day shown $from.state When the server answers it $answer.state Then « $announcement » is announced',
    async ({ from, answer, announcement }) => {
      const date = from.date ?? '';
      const opened = await openWriting({
        getAvailabilityCalendar: () => novemberWith({ [date]: from }),
        setDayOpen: () => answered(answer),
      });

      opened.calendar.toggleDay(date);
      await flush();

      expect({
        state: stateOn(opened.calendar, date),
        announcement: opened.calendar.announcement(),
      }).toEqual({ state: answer.state, announcement });
    },
  );

  it('Given a write in flight on the 12th When the 12th is toggled again and then the 13th Then the 12th is written once, both days are pending, and the 12th leaves the pending set on its answer', async () => {
    const twelfth = new Subject<DayResult>();
    const opened = await openWriting({
      setDayOpen: (date) => (date === '2026-11-12' ? twelfth : new Subject<DayResult>()),
    });

    opened.calendar.toggleDay('2026-11-12');
    await flush();
    opened.calendar.toggleDay('2026-11-12');
    await flush();
    opened.calendar.toggleDay('2026-11-13');
    await flush();
    const meanwhile = {
      calls: opened.setDayOpen.mock.calls,
      pending: [...opened.calendar.pending()].sort(),
      state: stateOn(opened.calendar, '2026-11-12'),
    };
    twelfth.next({ success: true, data: aCalendarDay({ date: '2026-11-12', state: 'closed' }) });
    twelfth.complete();
    await flush();

    expect({
      meanwhile,
      after: {
        pending: [...opened.calendar.pending()],
        state: stateOn(opened.calendar, '2026-11-12'),
      },
    }).toEqual({
      meanwhile: {
        calls: [
          ['2026-11-12', false],
          ['2026-11-13', false],
        ],
        pending: ['2026-11-12', '2026-11-13'],
        state: 'open',
      },
      after: { pending: ['2026-11-13'], state: 'closed' },
    });
  });

  it.each<{
    reason: BookingAdminFailure;
    detail: string;
    reads: readonly (readonly [string | null])[];
  }>([
    {
      reason: 'day-past',
      detail: 'Ce jour est passé : il ne peut plus être modifié.',
      reads: [[null], [null]],
    },
    {
      reason: 'day-in-closure',
      detail: 'Ce jour est couvert par une fermeture : modifiez-la dans la section Fermetures.',
      reads: [[null], [null]],
    },
    {
      reason: 'network',
      detail: 'Modification impossible : vérifiez votre connexion, puis réessayez.',
      reads: [[null]],
    },
    {
      reason: 'server',
      detail: "Modification impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
      reads: [[null]],
    },
    {
      reason: 'invalid',
      detail: "Modification impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
      reads: [[null]],
    },
  ])(
    'Given the server refuses with $reason When the 12th is toggled Then « $detail » is told, the day keeps its state and the month is read $reads.length time(s)',
    async ({ reason, detail, reads }) => {
      const opened = await openWriting({ setDayOpen: () => refused(reason) });

      opened.calendar.toggleDay('2026-11-12');
      await flush();

      expect({
        toasts: opened.toasts(),
        state: stateOn(opened.calendar, '2026-11-12'),
        reads: opened.read.mock.calls,
        pending: [...opened.calendar.pending()],
        announcement: opened.calendar.announcement(),
      }).toEqual({
        toasts: [{ severity: 'error', detail }],
        state: 'open',
        reads,
        pending: [],
        announcement: '',
      });
    },
  );

  it('Given a refused write on the 12th When it is toggled again Then a new write is sent', async () => {
    const opened = await openWriting({ setDayOpen: () => refused('network') });

    opened.calendar.toggleDay('2026-11-12');
    await flush();
    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect(opened.setDayOpen.mock.calls).toEqual([
      ['2026-11-12', false],
      ['2026-11-12', false],
    ]);
  });

  it('Given December shown When a day is refused under a closure Then December is read again by name', async () => {
    const opened = await openWriting({ setDayOpen: () => refused('day-in-closure') });

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    opened.calendar.toggleDay('2026-12-15');
    await flush();

    expect({
      writes: opened.setDayOpen.mock.calls,
      reads: opened.read.mock.calls,
    }).toEqual({
      writes: [['2026-12-15', false]],
      reads: [[null], ['2026-12'], ['2026-12']],
    });
  });
});

const decemberSlowFirst = (): BookingGateway['getAvailabilityCalendar'] => {
  let decemberReads = 0;
  return (month) => {
    if (month !== '2026-12') return byMonth(month);
    decemberReads += 1;
    return decemberReads === 1
      ? NEVER
      : defer(() => of(aCalendarMonthOf('2026-12', { closePublicHolidays: false })));
  };
};

describe('AvailabilityCalendar: relecture pendant un changement de mois', () => {
  it('Given December on its way When the holidays setting is written Then December is read again after the write and the switch is free again', async () => {
    const opened = await openWriting({ getAvailabilityCalendar: decemberSlowFirst() });

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    opened.calendar.setHolidaysClosed(false);
    await flush();

    expect({
      reads: opened.read.mock.calls,
      saving: opened.calendar.holidaysSaving(),
      month: opened.calendar.view()?.month,
      shown: opened.calendar.view()?.closePublicHolidays,
    }).toEqual({
      reads: [[null], ['2026-12'], ['2026-12']],
      saving: false,
      month: '2026-12',
      shown: false,
    });
  });

  it('Given December on its way When a day is refused as past Then December is read again after the refusal', async () => {
    const opened = await openWriting({
      getAvailabilityCalendar: decemberSlowFirst(),
      setDayOpen: () => refused('day-past'),
    });

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect({
      writes: opened.setDayOpen.mock.calls.length,
      reads: opened.read.mock.calls,
      month: opened.calendar.view()?.month,
    }).toEqual({ writes: 1, reads: [[null], ['2026-12'], ['2026-12']], month: '2026-12' });
  });

  it('Given December on its way When the page asks a reload Then December is read again after the request', async () => {
    const opened = await openWriting({ getAvailabilityCalendar: decemberSlowFirst() });

    opened.calendar.goToMonth('2026-12', '2026-12-12');
    await flush();
    opened.calendar.reload();
    await flush();

    expect({
      reads: opened.read.mock.calls,
      month: opened.calendar.view()?.month,
      focusDate: opened.calendar.focusDate(),
    }).toEqual({ reads: [[null], ['2026-12'], ['2026-12']], month: '2026-12', focusDate: null });
  });
});

describe('AvailabilityCalendar: jours fériés', () => {
  const holidaysServer = (initial: boolean): Writes => {
    let closed = initial;
    return {
      getAvailabilityCalendar: () =>
        defer(() => of(aCalendarMonthOf('2026-11', { closePublicHolidays: closed }))),
      setClosePublicHolidays: (value) =>
        defer(() => {
          closed = value;
          return of({ success: true, data: value } as const);
        }),
    };
  };

  it.each([
    { from: true, to: false, announcement: 'Jours fériés ouverts selon la semaine type.' },
    { from: false, to: true, announcement: 'Jours fériés fermés.' },
  ])(
    'Given holidays closed: $from When the setting is changed to $to Then it is written once, the month is read again, the view follows and « $announcement » is announced',
    async ({ from, to, announcement }) => {
      const opened = await openWriting(holidaysServer(from));

      opened.calendar.setHolidaysClosed(to);
      await flush();

      expect({
        writes: opened.setClosePublicHolidays.mock.calls,
        reads: opened.read.mock.calls,
        shown: opened.calendar.view()?.closePublicHolidays,
        saving: opened.calendar.holidaysSaving(),
        announcement: opened.calendar.announcement(),
        toasts: opened.toasts(),
      }).toEqual({
        writes: [[to]],
        reads: [[null], [null]],
        shown: to,
        saving: false,
        announcement,
        toasts: [],
      });
    },
  );

  it('Given the setting being written When it is changed again Then it is saving, and nothing more is written until the answer', async () => {
    const answer = new Subject<BookingAdminResult<boolean>>();
    const opened = await openWriting({ setClosePublicHolidays: () => answer });

    opened.calendar.setHolidaysClosed(false);
    await flush();
    opened.calendar.setHolidaysClosed(false);
    await flush();
    const meanwhile = {
      writes: opened.setClosePublicHolidays.mock.calls.length,
      saving: opened.calendar.holidaysSaving(),
    };
    answer.next({ success: true, data: false });
    answer.complete();
    await flush();

    expect({ meanwhile, saving: opened.calendar.holidaysSaving() }).toEqual({
      meanwhile: { writes: 1, saving: true },
      saving: false,
    });
  });

  it('Given the setting written When the month is still being read again Then it stays saving and a new change is ignored until the month arrives', async () => {
    const reread = new Subject<CalendarMonth>();
    let reads = 0;
    const opened = await openWriting({
      getAvailabilityCalendar: () => {
        reads += 1;
        return reads === 1
          ? of(aCalendarMonthOf('2026-11', { closePublicHolidays: true }))
          : reread;
      },
    });

    opened.calendar.setHolidaysClosed(false);
    await flush();
    opened.calendar.setHolidaysClosed(false);
    await flush();
    const meanwhile = {
      writes: opened.setClosePublicHolidays.mock.calls.length,
      saving: opened.calendar.holidaysSaving(),
    };
    reread.next(aCalendarMonthOf('2026-11', { closePublicHolidays: false }));
    reread.complete();
    await flush();

    expect({
      meanwhile,
      saving: opened.calendar.holidaysSaving(),
      shown: opened.calendar.view()?.closePublicHolidays,
    }).toEqual({ meanwhile: { writes: 1, saving: true }, saving: false, shown: false });
  });

  it('Given the setting written When reading the month again fails Then it is no longer saving', async () => {
    let reads = 0;
    const opened = await openWriting({
      getAvailabilityCalendar: (month) =>
        defer(() => {
          reads += 1;
          return reads === 1 ? byMonth(month) : throwError(() => new Error('offline'));
        }),
    });

    opened.calendar.setHolidaysClosed(false);
    await flush();

    expect({
      saving: opened.calendar.holidaysSaving(),
      state: opened.calendar.state(),
    }).toEqual({ saving: false, state: 'error' });
  });

  it('Given December shown When the setting is changed Then December is read again by name', async () => {
    const opened = await openWriting();

    opened.calendar.goToMonth('2026-12', null);
    await flush();
    opened.calendar.setHolidaysClosed(false);
    await flush();

    expect(opened.read.mock.calls).toEqual([[null], ['2026-12'], ['2026-12']]);
  });

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    {
      reason: 'network',
      detail: 'Réglage des jours fériés impossible : vérifiez votre connexion, puis réessayez.',
    },
    {
      reason: 'server',
      detail:
        "Réglage des jours fériés impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
  ])(
    'Given the server refuses with $reason When the setting is changed Then « $detail » is told and the view keeps the server setting',
    async ({ reason, detail }) => {
      const opened = await openWriting({
        setClosePublicHolidays: () => defer(() => of({ success: false, reason } as const)),
      });

      opened.calendar.setHolidaysClosed(false);
      await flush();

      expect({
        toasts: opened.toasts(),
        shown: opened.calendar.view()?.closePublicHolidays,
        reads: opened.read.mock.calls,
        saving: opened.calendar.holidaysSaving(),
        announcement: opened.calendar.announcement(),
      }).toEqual({
        toasts: [{ severity: 'error', detail }],
        shown: true,
        reads: [[null]],
        saving: false,
        announcement: '',
      });
    },
  );
});

describe('AvailabilityCalendar: rendez-vous sur un jour fermé', () => {
  const BOOKINGS: readonly AdminBooking[] = [
    anAdminBooking({ id: 'b-evening', startsAt: '2026-11-12T17:00:00.000Z' }),
    anAdminBooking({ id: 'b-after-midnight', startsAt: '2026-11-11T23:30:00.000Z' }),
    anAdminBooking({
      id: 'b-cancelled',
      startsAt: '2026-11-12T09:00:00.000Z',
      status: 'cancelled',
      cancelledBy: 'visitor',
    }),
    anAdminBooking({ id: 'b-next-day', startsAt: '2026-11-13T09:00:00.000Z' }),
  ];
  const withBookings =
    (bookings: readonly AdminBooking[]): Writes['getBookings'] =>
    () =>
      defer(() => of(bookings));

  it('Given the calendar When it opens and two days are toggled Then the upcoming bookings are read once', async () => {
    const opened = await openWriting({ getBookings: withBookings(BOOKINGS) });

    opened.calendar.toggleDay('2026-11-12');
    await flush();
    opened.calendar.toggleDay('2026-11-16');
    await flush();

    expect(opened.getBookings.mock.calls).toEqual([['upcoming']]);
  });

  it('Given two confirmed bookings on the 12th in Paris time When the 12th is closed Then the day is closed anyway and the warning counts those two only', async () => {
    const opened = await openWriting({ getBookings: withBookings(BOOKINGS) });

    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect({
      state: stateOn(opened.calendar, '2026-11-12'),
      warning: opened.calendar.bookingWarning(),
    }).toEqual({ state: 'closed', warning: { date: '2026-11-12', count: 2 } });
  });

  it('Given one booking on the 13th When the 13th is closed Then the warning counts one', async () => {
    const opened = await openWriting({ getBookings: withBookings(BOOKINGS) });

    opened.calendar.toggleDay('2026-11-13');
    await flush();

    expect(opened.calendar.bookingWarning()).toEqual({ date: '2026-11-13', count: 1 });
  });

  it('Given no booking on the 16th When it is closed Then no warning is given', async () => {
    const opened = await openWriting({ getBookings: withBookings(BOOKINGS) });

    opened.calendar.toggleDay('2026-11-16');
    await flush();

    expect({
      state: stateOn(opened.calendar, '2026-11-16'),
      warning: opened.calendar.bookingWarning(),
    }).toEqual({ state: 'closed', warning: null });
  });

  it('Given a warning for the closed 12th When the 12th is reopened Then the warning goes', async () => {
    const opened = await openWriting({ getBookings: withBookings(BOOKINGS) });

    opened.calendar.toggleDay('2026-11-12');
    await flush();
    const closed = opened.calendar.bookingWarning();
    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect({
      closed,
      writes: opened.setDayOpen.mock.calls,
      reopened: opened.calendar.bookingWarning(),
    }).toEqual({
      closed: { date: '2026-11-12', count: 2 },
      writes: [
        ['2026-11-12', false],
        ['2026-11-12', true],
      ],
      reopened: null,
    });
  });

  it('Given bookings on the 12th When its closing is refused Then no warning is given', async () => {
    const opened = await openWriting({
      getBookings: withBookings(BOOKINGS),
      setDayOpen: () => refused('server'),
    });

    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect(opened.calendar.bookingWarning()).toBeNull();
  });

  it('Given the bookings cannot be read When the 12th is closed Then it is closed without warning nor error', async () => {
    const opened = await openWriting({ getBookings: () => throwError(() => new Error('down')) });

    opened.calendar.toggleDay('2026-11-12');
    await flush();

    expect({
      state: opened.calendar.state(),
      day: stateOn(opened.calendar, '2026-11-12'),
      warning: opened.calendar.bookingWarning(),
      toasts: opened.toasts(),
    }).toEqual({ state: 'ready', day: 'closed', warning: null, toasts: [] });
  });

  it('Given the bookings never answer When the calendar opens Then the month is shown anyway', async () => {
    const opened = await openWriting({ getBookings: () => NEVER });

    expect({
      state: opened.calendar.state(),
      month: opened.calendar.view()?.month,
      reads: opened.getBookings.mock.calls,
    }).toEqual({ state: 'ready', month: '2026-11', reads: [['upcoming']] });
  });
});
