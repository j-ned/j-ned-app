import { inputBinding, outputBinding, signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { CalendarMonth } from '@features/booking/domain/models/booking-admin.model';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { toCalendarMonthView, type CalendarMonthView } from '../calendar-month-view';
import { aCalendarMonthOf } from '../testing/calendar-month-builder';
import { AdminMonthGrid, type CalendarMonthRequest } from './admin-month-grid';

const CONGES = { startsOn: '2026-11-24', endsOn: '2026-11-27', reason: 'Congés' } as const;

const NOVEMBER = aCalendarMonthOf('2026-11', {
  today: '2026-11-10',
  previousMonth: '2026-10',
  nextMonth: '2026-12',
  days: {
    '2026-11-11': { state: 'open', holiday: 'Armistice 1918' },
    '2026-11-12': { state: 'closed' },
    '2026-11-14': { state: 'empty', slotCount: 0 },
    '2026-11-15': { state: 'holiday', holiday: 'Fête témoin' },
    '2026-11-24': { state: 'closed-period', closure: CONGES },
  },
});

const DECEMBER = aCalendarMonthOf('2026-12', {
  today: '2026-11-10',
  previousMonth: '2026-11',
  nextMonth: '2027-01',
});

type Grid = {
  readonly fixture: ComponentFixture<AdminMonthGrid>;
  readonly host: HTMLElement;
  readonly view: WritableSignal<CalendarMonthView>;
  readonly focusDate: WritableSignal<string | null>;
  readonly activated: string[];
  readonly requested: CalendarMonthRequest[];
};

async function renderGrid(month: CalendarMonth, focus: string | null = null): Promise<Grid> {
  const view = signal(toCalendarMonthView(month));
  const focusDate = signal<string | null>(focus);
  const activated: string[] = [];
  const requested: CalendarMonthRequest[] = [];
  const fixture = TestBed.createComponent(AdminMonthGrid, {
    bindings: [
      inputBinding('view', view),
      inputBinding('focusDate', focusDate),
      outputBinding<string>('dayActivated', (date) => activated.push(date)),
      outputBinding<CalendarMonthRequest>('monthRequested', (request) => requested.push(request)),
    ],
  });
  await settle(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    view,
    focusDate,
    activated,
    requested,
  };
}

const days = (host: HTMLElement): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>('[data-testid="admin-calendar-day"]'),
];

const dayOn = (host: HTMLElement, date: string): HTMLElement | null =>
  days(host)[Number(date.slice(8)) - 1] ?? null;

const tabStops = (host: HTMLElement): readonly string[] =>
  days(host)
    .filter((day) => day.getAttribute('tabindex') === '0')
    .map((day) => accessibleName(day, host));

const focusedName = (host: HTMLElement): string | null => {
  const focused = host.ownerDocument.activeElement;
  return focused instanceof HTMLElement && host.contains(focused)
    ? accessibleName(focused, host)
    : null;
};

const iconsOf = (day: HTMLElement | null): readonly string[] =>
  [...(day?.querySelectorAll('use') ?? [])].map(
    (use) => use.getAttribute('href')?.split('#')[1] ?? '',
  );

const visibleText = (day: HTMLElement | null): string =>
  (day?.textContent ?? '').replace(/\s+/g, '');

async function press(
  grid: Grid,
  date: string,
  key: string,
  modifiers: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const day = dayOn(grid.host, date);
  day?.focus();
  const event = new KeyboardEvent('keydown', {
    ...modifiers,
    key,
    bubbles: true,
    cancelable: true,
  });
  day?.dispatchEvent(event);
  await settle(grid.fixture);
  return event;
}

describe('AdminMonthGrid: structure', () => {
  it('Given November 2026 When the grid renders Then it is a table of role grid named by the month label and described by the help, headed by the seven days', async () => {
    const { host } = await renderGrid(NOVEMBER);
    const grid = byTestId(host, 'admin-calendar-grid');
    const headers = [...(grid?.querySelectorAll('thead th') ?? [])];

    expect({
      tag: grid?.tagName,
      role: grid?.getAttribute('role'),
      labelledBy: grid?.getAttribute('aria-labelledby'),
      describedBy: grid?.getAttribute('aria-describedby'),
      headers: headers.map((header) => header.textContent?.trim()),
      abbr: headers.map((header) => header.getAttribute('abbr')),
      scope: headers.map((header) => header.getAttribute('scope')),
    }).toEqual({
      tag: 'TABLE',
      role: 'grid',
      labelledBy: 'admin-calendar-month-label',
      describedBy: 'admin-calendar-help',
      headers: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'],
      abbr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
      scope: ['col', 'col', 'col', 'col', 'col', 'col', 'col'],
    });
  });

  it('Given November 2026 When the grid renders Then each of the six weeks is a row of seven grid cells, one native button per day and none in the empty cells', async () => {
    const { host } = await renderGrid(NOVEMBER);
    const grid = byTestId(host, 'admin-calendar-grid');
    const rows = [...(grid?.querySelectorAll('tbody tr') ?? [])];
    const cells = [...(grid?.querySelectorAll('tbody td') ?? [])];

    expect({
      rows: rows.map((row) => row.querySelectorAll('td[role="gridcell"]').length),
      cells: cells.filter((cell) => cell.getAttribute('role') === 'gridcell').length,
      empty: cells.filter((cell) => cell.querySelector('button') === null).length,
      days: days(host).map((day) => `${day.tagName}:${day.getAttribute('type')}`),
      inCells: days(host).every((day) => day.parentElement?.getAttribute('role') === 'gridcell'),
      firstRowEmpty: [...(rows[0]?.querySelectorAll('td') ?? [])].map(
        (cell) => cell.querySelector('button') === null,
      ),
    }).toEqual({
      rows: [7, 7, 7, 7, 7, 7],
      cells: 42,
      empty: 12,
      days: Array.from({ length: 30 }, () => 'BUTTON:button'),
      inCells: true,
      firstRowEmpty: [true, true, true, true, true, true, false],
    });
  });

  it.each([
    {
      date: '2026-11-05',
      state: 'past',
      name: 'jeudi 5 novembre 2026, passé',
      disabled: 'true',
      text: '5',
      icons: [],
    },
    {
      date: '2026-11-12',
      state: 'closed',
      name: 'jeudi 12 novembre 2026, fermé',
      disabled: null,
      text: '12Fermé',
      icons: ['solid-lock'],
    },
    {
      date: '2026-11-15',
      state: 'holiday',
      name: 'dimanche 15 novembre 2026, férié (Fête témoin), fermé',
      disabled: null,
      text: '15Férié',
      icons: ['solid-flag'],
    },
    {
      date: '2026-11-24',
      state: 'closed-period',
      name: 'mardi 24 novembre 2026, fermé par la période du mardi 24 novembre 2026 au vendredi 27 novembre 2026 (Congés)',
      disabled: 'true',
      text: '24Période',
      icons: ['solid-calendar-days'],
    },
    {
      date: '2026-11-13',
      state: 'open',
      name: 'vendredi 13 novembre 2026, ouvert, 4 créneaux',
      disabled: null,
      text: '134créneaux',
      icons: [],
    },
    {
      date: '2026-11-11',
      state: 'open',
      name: 'mercredi 11 novembre 2026, férié (Armistice 1918) rouvert, 4 créneaux',
      disabled: null,
      text: '114créneaux',
      icons: ['solid-flag'],
    },
    {
      date: '2026-11-14',
      state: 'empty',
      name: 'samedi 14 novembre 2026, aucun créneau',
      disabled: null,
      text: '14—',
      icons: [],
    },
  ])(
    'Given the $state day $date When the grid renders Then its button is named « $name », marked by its state, an icon and a label rather than by colour',
    async ({ date, state, name, disabled, text, icons }) => {
      const { host } = await renderGrid(NOVEMBER);
      const day = dayOn(host, date);

      expect({
        state: day?.getAttribute('data-state'),
        name: day ? accessibleName(day, host) : null,
        ariaDisabled: day?.getAttribute('aria-disabled') ?? null,
        nativeDisabled: day instanceof HTMLButtonElement ? day.disabled : null,
        text: visibleText(day),
        icons: iconsOf(day),
      }).toEqual({ state, name, ariaDisabled: disabled, nativeDisabled: false, text, icons });
    },
  );

  it('Given November with today on the 10th When the grid renders Then only that day is the current date', async () => {
    const { host } = await renderGrid(NOVEMBER);

    expect(
      days(host)
        .filter((day) => day.hasAttribute('aria-current'))
        .map((day) => `${accessibleName(day, host)}=${day.getAttribute('aria-current')}`),
    ).toEqual(['mardi 10 novembre 2026, ouvert, 4 créneaux=date']);
  });
});

describe('AdminMonthGrid: focus itinérant', () => {
  it('Given November with today in it When the grid renders Then today is the only tab stop, every other day is out of the tab order, and the focus is not taken', async () => {
    const { host } = await renderGrid(NOVEMBER);

    expect({
      stops: tabStops(host),
      others: days(host).filter((day) => day.getAttribute('tabindex') === '-1').length,
      focused: focusedName(host),
    }).toEqual({
      stops: ['mardi 10 novembre 2026, ouvert, 4 créneaux'],
      others: 29,
      focused: null,
    });
  });

  it('Given December without today and no day to focus When the grid renders Then the 1st is the tab stop', async () => {
    const { host } = await renderGrid(DECEMBER);

    expect(tabStops(host)).toEqual(['mardi 1er décembre 2026, ouvert, 4 créneaux']);
  });

  it('Given a day to focus in the month When the grid renders Then that day is the tab stop and holds the focus', async () => {
    const { host } = await renderGrid(DECEMBER, '2026-12-12');

    expect({ stops: tabStops(host), focused: focusedName(host) }).toEqual({
      stops: ['samedi 12 décembre 2026, ouvert, 4 créneaux'],
      focused: 'samedi 12 décembre 2026, ouvert, 4 créneaux',
    });
  });

  it('Given a day to focus outside the month When the grid renders Then the usual tab stop stands and the focus is not taken', async () => {
    const { host } = await renderGrid(DECEMBER, '2027-01-05');

    expect({ stops: tabStops(host), focused: focusedName(host) }).toEqual({
      stops: ['mardi 1er décembre 2026, ouvert, 4 créneaux'],
      focused: null,
    });
  });

  it('Given November shown When December arrives with a day to focus Then the focus lands on that day of December', async () => {
    const grid = await renderGrid(NOVEMBER);

    grid.view.set(toCalendarMonthView(DECEMBER));
    grid.focusDate.set('2026-12-12');
    await settle(grid.fixture);

    expect({ stops: tabStops(grid.host), focused: focusedName(grid.host) }).toEqual({
      stops: ['samedi 12 décembre 2026, ouvert, 4 créneaux'],
      focused: 'samedi 12 décembre 2026, ouvert, 4 créneaux',
    });
  });
});

describe('AdminMonthGrid: clavier dans le mois', () => {
  it.each([
    { key: 'ArrowRight', expected: 'vendredi 13 novembre 2026, ouvert, 4 créneaux' },
    {
      key: 'ArrowLeft',
      expected: 'mercredi 11 novembre 2026, férié (Armistice 1918) rouvert, 4 créneaux',
    },
    { key: 'ArrowDown', expected: 'jeudi 19 novembre 2026, ouvert, 4 créneaux' },
    { key: 'ArrowUp', expected: 'jeudi 5 novembre 2026, passé' },
    { key: 'Home', expected: 'lundi 9 novembre 2026, passé' },
    { key: 'End', expected: 'dimanche 15 novembre 2026, férié (Fête témoin), fermé' },
  ])(
    'Given the 12th focused When $key is pressed Then the focus and the single tab stop move to « $expected », past days included, and the page does not scroll',
    async ({ key, expected }) => {
      const grid = await renderGrid(NOVEMBER, '2026-11-12');

      const event = await press(grid, '2026-11-12', key);

      expect({
        focused: focusedName(grid.host),
        stops: tabStops(grid.host),
        prevented: event.defaultPrevented,
        requested: grid.requested,
      }).toEqual({ focused: expected, stops: [expected], prevented: true, requested: [] });
    },
  );

  it('Given the 17th focused When ArrowDown reaches a period-closed day Then the focus lands on it', async () => {
    const grid = await renderGrid(NOVEMBER, '2026-11-17');

    await press(grid, '2026-11-17', 'ArrowDown');

    expect(focusedName(grid.host)).toBe(
      'mardi 24 novembre 2026, fermé par la période du mardi 24 novembre 2026 au vendredi 27 novembre 2026 (Congés)',
    );
  });

  it.each(['Tab', 'Enter', ' '])(
    'Given the 12th focused When « %s » is pressed Then the grid leaves it to the browser',
    async (key) => {
      const grid = await renderGrid(NOVEMBER, '2026-11-12');

      const event = await press(grid, '2026-11-12', key);

      expect({
        prevented: event.defaultPrevented,
        stops: tabStops(grid.host),
        requested: grid.requested,
      }).toEqual({
        prevented: false,
        stops: ['jeudi 12 novembre 2026, fermé'],
        requested: [],
      });
    },
  );
  it.each([
    { key: 'ArrowLeft', modifier: 'altKey' },
    { key: 'ArrowRight', modifier: 'altKey' },
    { key: 'Home', modifier: 'ctrlKey' },
    { key: 'End', modifier: 'metaKey' },
    { key: 'ArrowDown', modifier: 'shiftKey' },
    { key: 'PageDown', modifier: 'shiftKey' },
    { key: 'PageUp', modifier: 'ctrlKey' },
  ] as const)(
    'Given the 12th focused When $key is pressed with $modifier Then the grid leaves it to the browser',
    async ({ key, modifier }) => {
      const grid = await renderGrid(NOVEMBER, '2026-11-12');

      const event = await press(grid, '2026-11-12', key, { [modifier]: true });

      expect({
        prevented: event.defaultPrevented,
        focused: focusedName(grid.host),
        stops: tabStops(grid.host),
        requested: grid.requested,
      }).toEqual({
        prevented: false,
        focused: 'jeudi 12 novembre 2026, fermé',
        stops: ['jeudi 12 novembre 2026, fermé'],
        requested: [],
      });
    },
  );
});

describe('AdminMonthGrid: clavier vers le mois voisin', () => {
  it.each([
    { from: '2026-11-12', key: 'PageDown', month: '2026-12', focusDate: '2026-12-12' },
    { from: '2026-11-12', key: 'PageUp', month: '2026-10', focusDate: '2026-10-12' },
    { from: '2026-11-30', key: 'ArrowRight', month: '2026-12', focusDate: '2026-12-01' },
    { from: '2026-11-26', key: 'ArrowDown', month: '2026-12', focusDate: '2026-12-03' },
    { from: '2026-11-03', key: 'ArrowUp', month: '2026-10', focusDate: '2026-10-27' },
    { from: '2026-11-30', key: 'End', month: '2026-12', focusDate: '2026-12-06' },
  ])(
    'Given $from focused When $key is pressed Then the month $month is asked with $focusDate to focus',
    async ({ from, key, month, focusDate }) => {
      const grid = await renderGrid(NOVEMBER, from);

      const event = await press(grid, from, key);

      expect({ requested: grid.requested, prevented: event.defaultPrevented }).toEqual({
        requested: [{ month, focusDate }],
        prevented: true,
      });
    },
  );

  it('Given a PageDown from the 31st When the next month is shorter Then its last day is asked', async () => {
    const grid = await renderGrid(
      aCalendarMonthOf('2027-01', { previousMonth: '2026-12', nextMonth: '2027-02' }),
      '2027-01-31',
    );

    await press(grid, '2027-01-31', 'PageDown');

    expect(grid.requested).toEqual([{ month: '2027-02', focusDate: '2027-02-28' }]);
  });

  it.each([
    { from: '2026-11-12', key: 'PageUp' },
    { from: '2026-11-01', key: 'ArrowLeft' },
    { from: '2026-11-04', key: 'ArrowUp' },
  ])(
    'Given the current month (no previous one) When $key is pressed on $from Then nothing is asked and the focus stays',
    async ({ from, key }) => {
      const grid = await renderGrid({ ...NOVEMBER, previousMonth: null }, from);

      const event = await press(grid, from, key);

      expect({
        requested: grid.requested,
        focused: focusedName(grid.host),
        prevented: event.defaultPrevented,
      }).toEqual({
        requested: [],
        focused: accessibleName(dayOn(grid.host, from) ?? grid.host, grid.host),
        prevented: true,
      });
    },
  );

  it.each([
    { from: '2026-11-12', key: 'PageDown' },
    { from: '2026-11-30', key: 'ArrowRight' },
    { from: '2026-11-26', key: 'ArrowDown' },
  ])(
    'Given the last month (no next one) When $key is pressed on $from Then nothing is asked and the focus stays',
    async ({ from, key }) => {
      const grid = await renderGrid({ ...NOVEMBER, nextMonth: null }, from);

      const event = await press(grid, from, key);

      expect({
        requested: grid.requested,
        focused: focusedName(grid.host),
        prevented: event.defaultPrevented,
      }).toEqual({
        requested: [],
        focused: accessibleName(dayOn(grid.host, from) ?? grid.host, grid.host),
        prevented: true,
      });
    },
  );
});

describe('AdminMonthGrid: activation', () => {
  it('Given an open day When it is clicked Then the grid tells which day', async () => {
    const grid = await renderGrid(NOVEMBER);

    dayOn(grid.host, '2026-11-13')?.click();
    await settle(grid.fixture);

    expect(grid.activated).toEqual(['2026-11-13']);
  });

  it.each(['2026-11-05', '2026-11-24'])(
    'Given the unavailable day %s When it is clicked Then the grid tells nothing',
    async (date) => {
      const grid = await renderGrid(NOVEMBER);

      dayOn(grid.host, date)?.click();
      await settle(grid.fixture);

      expect({ activated: grid.activated, present: dayOn(grid.host, date) !== null }).toEqual({
        activated: [],
        present: true,
      });
    },
  );
});
