import { describe, expect, it } from 'vitest';
import type { CalendarDay } from '@features/booking/domain/models/booking-admin.model';
import { aCalendarDay } from '@features/booking/testing/booking-builders';
import {
  describeDay,
  toCalendarMonthView,
  wantsOpen,
  type CalendarCell,
  type CalendarMonthView,
} from './calendar-month-view';
import { aCalendarMonthOf, datesOfMonth } from './testing/calendar-month-builder';

const CONGES = { startsOn: '2026-11-24', endsOn: '2026-11-27', reason: 'Congés' } as const;

const cellsOf = (view: CalendarMonthView): readonly CalendarCell[] =>
  view.weeks.flat().filter((cell): cell is CalendarCell => cell !== null);

const cellOn = (view: CalendarMonthView, date: string): CalendarCell | undefined =>
  cellsOf(view).find((cell) => cell.date === date);

const emptyCellsOf = (week: readonly (CalendarCell | null)[] | undefined): number =>
  (week ?? []).filter((cell) => cell === null).length;

describe('toCalendarMonthView: semaines', () => {
  it.each([
    { month: '2026-11', weeks: 6, leading: 6, trailing: 6, when: 'starts on a Sunday' },
    { month: '2027-02', weeks: 4, leading: 0, trailing: 0, when: 'starts on a Monday, 28 days' },
    { month: '2027-03', weeks: 5, leading: 0, trailing: 4, when: 'starts on a Monday, 31 days' },
    { month: '2026-03', weeks: 6, leading: 6, trailing: 5, when: 'starts on a Sunday, 31 days' },
    { month: '2028-02', weeks: 5, leading: 1, trailing: 5, when: 'leap February on a Tuesday' },
  ])(
    'Given $month ($when) When viewed Then it spans $weeks weeks of seven days from Monday, $leading empty cells before the 1st and $trailing after the last day',
    ({ month, weeks, leading, trailing }) => {
      const view = toCalendarMonthView(aCalendarMonthOf(month, { today: `${month}-01` }));

      expect({
        weeks: view.weeks.length,
        lengths: view.weeks.map((week) => week.length),
        leading: emptyCellsOf(view.weeks[0]),
        trailing: emptyCellsOf(view.weeks.at(-1)),
        dates: cellsOf(view).map((cell) => cell.date),
        days: cellsOf(view).map((cell) => cell.dayOfMonth),
      }).toEqual({
        weeks,
        lengths: Array.from({ length: weeks }, () => 7),
        leading,
        trailing,
        dates: datesOfMonth(month),
        days: datesOfMonth(month).map((_, index) => index + 1),
      });
    },
  );

  it('Given November 2026 When viewed Then the 1st stands in the Sunday column and the 2nd opens the second week', () => {
    const view = toCalendarMonthView(aCalendarMonthOf('2026-11'));

    expect({
      first: view.weeks[0]?.[6]?.date,
      second: view.weeks[1]?.[0]?.date,
      last: view.weeks[5]?.[0]?.date,
    }).toEqual({ first: '2026-11-01', second: '2026-11-02', last: '2026-11-30' });
  });
});

describe('toCalendarMonthView: en-tête du mois', () => {
  it.each([
    { month: '2026-11', label: 'Novembre 2026', previousMonth: null, nextMonth: '2026-12' },
    { month: '2027-08', label: 'Août 2027', previousMonth: '2027-07', nextMonth: '2027-09' },
    { month: '2027-10', label: 'Octobre 2027', previousMonth: '2027-09', nextMonth: null },
  ])(
    'Given $month When viewed Then it is labelled « $label » with its neighbour months kept',
    ({ month, label, previousMonth, nextMonth }) => {
      const view = toCalendarMonthView(
        aCalendarMonthOf(month, {
          today: '2026-11-10',
          previousMonth,
          nextMonth,
          closePublicHolidays: false,
        }),
      );

      expect({
        month: view.month,
        label: view.label,
        previousMonth: view.previousMonth,
        nextMonth: view.nextMonth,
        closePublicHolidays: view.closePublicHolidays,
      }).toEqual({ month, label, previousMonth, nextMonth, closePublicHolidays: false });
    },
  );

  it('Given holidays closed When viewed Then the view says so', () => {
    expect(
      toCalendarMonthView(aCalendarMonthOf('2026-11', { closePublicHolidays: true }))
        .closePublicHolidays,
    ).toBe(true);
  });
});

describe('toCalendarMonthView: cases', () => {
  it.each<{ day: Partial<CalendarDay>; cell: Omit<CalendarCell, 'dayOfMonth' | 'today'> }>([
    {
      day: { date: '2026-11-05', state: 'past' },
      cell: {
        date: '2026-11-05',
        state: 'past',
        actionable: false,
        label: 'jeudi 5 novembre 2026, passé',
        shortLabel: '',
        icon: null,
        reopenedHoliday: false,
      },
    },
    {
      day: { date: '2026-11-12', state: 'closed' },
      cell: {
        date: '2026-11-12',
        state: 'closed',
        actionable: true,
        label: 'jeudi 12 novembre 2026, fermé',
        shortLabel: 'Fermé',
        icon: 'lock',
        reopenedHoliday: false,
      },
    },
    {
      day: { date: '2026-11-11', state: 'holiday', holiday: 'Armistice 1918' },
      cell: {
        date: '2026-11-11',
        state: 'holiday',
        actionable: true,
        label: 'mercredi 11 novembre 2026, férié (Armistice 1918), fermé',
        shortLabel: 'Férié',
        icon: 'flag',
        reopenedHoliday: false,
      },
    },
    {
      day: { date: '2026-11-24', state: 'closed-period', closure: CONGES },
      cell: {
        date: '2026-11-24',
        state: 'closed-period',
        actionable: false,
        label:
          'mardi 24 novembre 2026, fermé par la période du mardi 24 novembre 2026 au vendredi 27 novembre 2026 (Congés)',
        shortLabel: 'Période',
        icon: 'calendar',
        reopenedHoliday: false,
      },
    },
    {
      day: { date: '2026-11-12', state: 'open', slotCount: 4 },
      cell: {
        date: '2026-11-12',
        state: 'open',
        actionable: true,
        label: 'jeudi 12 novembre 2026, ouvert, 4 créneaux',
        shortLabel: '4 créneaux',
        icon: null,
        reopenedHoliday: false,
      },
    },
    {
      day: { date: '2026-11-11', state: 'open', holiday: 'Armistice 1918', slotCount: 4 },
      cell: {
        date: '2026-11-11',
        state: 'open',
        actionable: true,
        label: 'mercredi 11 novembre 2026, férié (Armistice 1918) rouvert, 4 créneaux',
        shortLabel: '4 créneaux',
        icon: null,
        reopenedHoliday: true,
      },
    },
    {
      day: { date: '2026-11-14', state: 'empty', slotCount: 0 },
      cell: {
        date: '2026-11-14',
        state: 'empty',
        actionable: true,
        label: 'samedi 14 novembre 2026, aucun créneau',
        shortLabel: '—',
        icon: null,
        reopenedHoliday: false,
      },
    },
  ])(
    'Given a $day.state day on $day.date When viewed Then its cell reads « $cell.label »',
    ({ day, cell }) => {
      const date = day.date ?? '';
      const view = toCalendarMonthView(aCalendarMonthOf('2026-11', { days: { [date]: day } }));

      expect(cellOn(view, date)).toEqual({
        ...cell,
        dayOfMonth: Number(date.slice(8)),
        today: false,
      });
    },
  );

  it('Given the server date When viewed Then only that day is today, still actionable', () => {
    const view = toCalendarMonthView(aCalendarMonthOf('2026-11', { today: '2026-11-10' }));

    expect({
      today: cellsOf(view)
        .filter((cell) => cell.today)
        .map((cell) => cell.date),
      actionable: cellOn(view, '2026-11-10')?.actionable,
      state: cellOn(view, '2026-11-10')?.state,
    }).toEqual({ today: ['2026-11-10'], actionable: true, state: 'open' });
  });

  it('Given a month after the current one When viewed Then none of its 31 days is today', () => {
    const view = toCalendarMonthView(aCalendarMonthOf('2026-12', { today: '2026-11-10' }));

    expect({
      cells: cellsOf(view).length,
      today: cellsOf(view).filter((cell) => cell.today),
    }).toEqual({ cells: 31, today: [] });
  });

  it('Given a month of every state When viewed Then only past and period-closed days are not actionable', () => {
    const view = toCalendarMonthView(
      aCalendarMonthOf('2026-11', {
        days: {
          '2026-11-11': { state: 'holiday', holiday: 'Armistice 1918' },
          '2026-11-12': { state: 'closed' },
          '2026-11-14': { state: 'empty', slotCount: 0 },
          '2026-11-24': { state: 'closed-period', closure: CONGES },
          '2026-11-25': { state: 'closed-period', closure: CONGES },
        },
      }),
    );

    expect(
      cellsOf(view)
        .filter((cell) => !cell.actionable)
        .map((cell) => cell.date),
    ).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-24',
      '2026-11-25',
    ]);
  });
});

describe('describeDay', () => {
  it.each<{ day: Partial<CalendarDay>; expected: string }>([
    {
      day: { date: '2026-11-12', state: 'open', slotCount: 4 },
      expected: 'jeudi 12 novembre 2026, ouvert, 4 créneaux',
    },
    {
      day: { date: '2026-11-13', state: 'open', slotCount: 1 },
      expected: 'vendredi 13 novembre 2026, ouvert, 1 créneau',
    },
    { day: { date: '2026-11-12', state: 'closed' }, expected: 'jeudi 12 novembre 2026, fermé' },
    {
      day: { date: '2026-11-01', state: 'holiday', holiday: 'Toussaint' },
      expected: 'dimanche 1er novembre 2026, férié (Toussaint), fermé',
    },
    {
      day: { date: '2026-11-11', state: 'open', holiday: 'Armistice 1918', slotCount: 2 },
      expected: 'mercredi 11 novembre 2026, férié (Armistice 1918) rouvert, 2 créneaux',
    },
    {
      day: {
        date: '2026-12-28',
        state: 'closed-period',
        closure: { startsOn: '2026-12-24', endsOn: '2027-01-01', reason: 'Congés' },
      },
      expected:
        'lundi 28 décembre 2026, fermé par la période du jeudi 24 décembre 2026 au vendredi 1er janvier 2027 (Congés)',
    },
    {
      day: {
        date: '2026-12-28',
        state: 'closed-period',
        closure: { startsOn: '2026-12-24', endsOn: '2027-01-01', reason: null },
      },
      expected:
        'lundi 28 décembre 2026, fermé par la période du jeudi 24 décembre 2026 au vendredi 1er janvier 2027',
    },
    {
      day: { date: '2026-11-14', state: 'empty', slotCount: 0 },
      expected: 'samedi 14 novembre 2026, aucun créneau',
    },
    { day: { date: '2026-11-09', state: 'past' }, expected: 'lundi 9 novembre 2026, passé' },
  ])('Given a $day.state day When described Then it reads « $expected »', ({ day, expected }) => {
    expect(describeDay(aCalendarDay(day))).toBe(expected);
  });
});

describe('wantsOpen', () => {
  it.each<{ state: CalendarDay['state']; holiday: string | null; open: boolean }>([
    { state: 'closed', holiday: null, open: true },
    { state: 'holiday', holiday: 'Armistice 1918', open: true },
    { state: 'open', holiday: null, open: false },
    { state: 'open', holiday: 'Armistice 1918', open: false },
    { state: 'empty', holiday: null, open: false },
  ])(
    'Given a day shown $state (holiday: $holiday) When it is activated Then the wanted state is open: $open',
    ({ state, holiday, open }) => {
      expect(wantsOpen(aCalendarDay({ state, holiday }))).toBe(open);
    },
  );
});
