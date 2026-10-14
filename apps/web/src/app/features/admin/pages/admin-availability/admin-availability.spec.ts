import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, Observable, Subject, defer, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AdminBooking,
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminFailure,
  BookingAdminResult,
  CalendarDay,
  CalendarMonth,
} from '@features/booking/domain/models/booking-admin.model';
import {
  aCalendarDay,
  anAdminBooking,
  anAvailabilityClosure,
  anAvailabilityRule,
} from '@features/booking/testing/booking-builders';
import { stubBookingGateway } from '@features/booking/testing/stub-booking-gateway';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { settleBounded } from '@shared/testing/settle';
import type { ToastMessage } from '@shared/ui/toast.types';
import { aCalendarMonthOf } from '../../application/testing/calendar-month-builder';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';
import { AdminAvailability } from './admin-availability';

@Component({ template: '' })
class BlankPage {}

const MONDAY_MORNING = anAvailabilityRule({ weekday: 1, startMinute: 540, endMinute: 720 });
const MONDAY_AFTERNOON = anAvailabilityRule({ weekday: 1, startMinute: 840, endMinute: 1080 });
const WEDNESDAY = anAvailabilityRule({ weekday: 3, startMinute: 600, endMinute: 690 });
const RULES: readonly AvailabilityRule[] = [MONDAY_MORNING, MONDAY_AFTERNOON, WEDNESDAY];
const EARLY_MONDAY = anAvailabilityRule({ weekday: 1, startMinute: 420, endMinute: 540 });

const ARMISTICE = anAvailabilityClosure({
  id: 'c-armistice',
  startsOn: '2026-11-11',
  endsOn: '2026-11-11',
  reason: null,
});
const CHRISTMAS = anAvailabilityClosure({
  id: 'c-noel',
  startsOn: '2026-12-24',
  endsOn: '2027-01-01',
  reason: "Congés de fin d'année",
});

const NOVEMBER = aCalendarMonthOf('2026-11', {
  today: '2026-11-10',
  previousMonth: null,
  nextMonth: '2026-12',
  days: { '2026-11-11': { state: 'holiday', holiday: 'Armistice 1918' } },
});
const DECEMBER = aCalendarMonthOf('2026-12', {
  today: '2026-11-10',
  previousMonth: '2026-11',
  nextMonth: '2027-01',
});
const JANUARY = aCalendarMonthOf('2027-01', {
  today: '2026-11-10',
  previousMonth: '2026-12',
  nextMonth: null,
});

const calendarMonth = (month: string | null): CalendarMonth =>
  ({ '2026-12': DECEMBER, '2027-01': JANUARY })[month ?? ''] ?? NOVEMBER;

const resolvedDay = (date: string, open: boolean): CalendarDay => {
  const day =
    calendarMonth(date.slice(0, 7)).days.find((candidate) => candidate.date === date) ??
    aCalendarDay({ date });
  if (open) return { ...day, state: day.slotCount > 0 ? 'open' : 'empty' };
  return { ...day, state: day.holiday === null ? 'closed' : 'holiday' };
};

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
type DayLabel = (typeof DAYS)[number];

const SLOT_TIMES = Array.from({ length: 26 }, (_, offset) => {
  const halfHour = 16 + offset;
  return `${String(Math.floor(halfHour / 2)).padStart(2, '0')}:${halfHour % 2 === 0 ? '00' : '30'}`;
});

const INITIAL_SUMMARY = [
  'Lundi : 09:00–12:00, 14:00–18:00',
  'Mardi : aucun créneau',
  'Mercredi : 10:00–11:30',
  'Jeudi : aucun créneau',
  'Vendredi : aucun créneau',
  'Samedi : aucun créneau',
  'Dimanche : aucun créneau',
];

type Spies = {
  readonly getAvailabilityRules: Mock<BookingGateway['getAvailabilityRules']>;
  readonly replaceAvailabilityRules: Mock<BookingGateway['replaceAvailabilityRules']>;
  readonly getClosures: Mock<BookingGateway['getClosures']>;
  readonly createClosure: Mock<BookingGateway['createClosure']>;
  readonly deleteClosure: Mock<BookingGateway['deleteClosure']>;
  readonly getAvailabilityCalendar: Mock<BookingGateway['getAvailabilityCalendar']>;
  readonly setDayOpen: Mock<BookingGateway['setDayOpen']>;
  readonly setClosePublicHolidays: Mock<BookingGateway['setClosePublicHolidays']>;
  readonly getBookings: Mock<BookingGateway['getBookings']>;
};

type Page = Spies & {
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
  readonly toast: Mock<ToastStore['add']>;
  readonly crash: unknown;
};

const byPeriod = (a: AvailabilityClosure, b: AvailabilityClosure): number =>
  a.startsOn.localeCompare(b.startsOn) || a.endsOn.localeCompare(b.endsOn);

function spies(overrides: Partial<Spies> = {}): Spies {
  let stored: readonly AvailabilityClosure[] = [ARMISTICE, CHRISTMAS];
  return {
    getAvailabilityRules: vi.fn<BookingGateway['getAvailabilityRules']>(() => of(RULES)),
    replaceAvailabilityRules: vi.fn<BookingGateway['replaceAvailabilityRules']>((rules) =>
      of({ success: true, data: rules } as const),
    ),
    getClosures: vi.fn<BookingGateway['getClosures']>(() =>
      defer(() => of([...stored].sort(byPeriod))),
    ),
    createClosure: vi.fn<BookingGateway['createClosure']>((closure) =>
      defer(() => {
        const created: AvailabilityClosure = { id: 'c-new', ...closure };
        stored = [...stored, created];
        return of({ success: true, data: created } as const);
      }),
    ),
    deleteClosure: vi.fn<BookingGateway['deleteClosure']>((id) =>
      defer(() => {
        stored = stored.filter((closure) => closure.id !== id);
        return of({ success: true, data: null } as const);
      }),
    ),
    getAvailabilityCalendar: vi.fn<BookingGateway['getAvailabilityCalendar']>((month) =>
      defer(() => of(calendarMonth(month))),
    ),
    setDayOpen: vi.fn<BookingGateway['setDayOpen']>((date, open) =>
      defer(() => of({ success: true, data: resolvedDay(date, open) } as const)),
    ),
    setClosePublicHolidays: vi.fn<BookingGateway['setClosePublicHolidays']>((value) =>
      defer(() => of({ success: true, data: value } as const)),
    ),
    getBookings: vi.fn<BookingGateway['getBookings']>(() => defer(() => of([]))),
    ...overrides,
  };
}

const withRules = (rules: readonly AvailabilityRule[]): Spies =>
  spies({ getAvailabilityRules: vi.fn<BookingGateway['getAvailabilityRules']>(() => of(rules)) });

async function openPage(gateway: Spies = spies()): Promise<Page> {
  const toast = vi.fn<ToastStore['add']>();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'admin/disponibilites',
          component: AdminAvailability,
          canDeactivate: [unsavedChangesGuard],
        },
        { path: 'admin', component: BlankPage },
      ]),
      { provide: BookingGateway, useValue: stubBookingGateway(gateway) },
      { provide: ToastStore, useValue: { add: toast } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const crash = await captureCrash(async () => {
    await harness.navigateByUrl('/admin/disponibilites');
    await settleBounded(harness.fixture);
  });
  return {
    ...gateway,
    fixture: harness.fixture,
    host: harness.fixture.nativeElement as HTMLElement,
    toast,
    crash,
  };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

const allByTestId = (root: ParentNode, testId: string): readonly HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const weekly = (host: HTMLElement): HTMLElement =>
  byTestId(host, 'admin-availability-weekly') ?? host;

const weekTemplate = (host: HTMLElement): HTMLElement =>
  byTestId(host, 'admin-week-template') ?? host;

const closures = (host: HTMLElement): HTMLElement => byTestId(host, 'admin-closures') ?? host;

const dayOptions = (host: HTMLElement): readonly HTMLElement[] =>
  allByTestId(weekTemplate(host), 'filter-option');

const slotButtons = (host: HTMLElement): readonly HTMLElement[] =>
  allByTestId(weekTemplate(host), 'admin-slot');

const pressedSlots = (host: HTMLElement): readonly string[] =>
  SLOT_TIMES.filter(
    (_, index) => slotButtons(host)[index]?.getAttribute('aria-pressed') === 'true',
  );

const pressedDays = (host: HTMLElement): readonly string[] =>
  dayOptions(host)
    .filter((option) => option.getAttribute('aria-pressed') === 'true')
    .map((option) => testIdText(option, 'filter-option-label'));

const summary = (host: HTMLElement): readonly string[] =>
  allByTestId(host, 'admin-week-summary-day').map(collapsed);

const summaryOf = (host: HTMLElement, label: DayLabel): string =>
  summary(host)[DAYS.indexOf(label)] ?? '';

const hiddenNotice = (host: HTMLElement): string | null => {
  const notice = byTestId(host, 'admin-week-hidden-ranges');
  return notice === null ? null : collapsed(notice);
};

const labelOf = (host: HTMLElement, control: Element | null): string => {
  if (control === null || control.id === '') return '';
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => label.getAttribute('for') === control.id,
  );
  return labels.length === 1 ? normalized(labels[0]) : '';
};

const nativeButton = (element: Element | null | undefined): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

async function press(
  page: Page,
  root: ParentNode | null,
  testId: string,
  index = 0,
): Promise<void> {
  nativeButton(root && byTestId(root, testId, index))?.click();
  await settleBounded(page.fixture);
}

async function chooseDay(page: Page, label: DayLabel): Promise<void> {
  nativeButton(dayOptions(page.host)[DAYS.indexOf(label)])?.click();
  await settleBounded(page.fixture);
}

async function toggleSlots(page: Page, label: DayLabel, ...times: string[]): Promise<void> {
  await chooseDay(page, label);
  for (const time of times) {
    nativeButton(slotButtons(page.host)[SLOT_TIMES.indexOf(time)])?.click();
    await settleBounded(page.fixture);
  }
}

async function save(page: Page): Promise<void> {
  await press(page, page.host, 'savebar-submit');
}

async function leaveByCancel(page: Page): Promise<void> {
  byTestId(page.host, 'savebar-cancel')?.click();
  await settleBounded(page.fixture);
}

const saveBarState = (page: Page): string => normalized(byTestId(page.host, 'savebar-state'));

const toasts = (page: Page): readonly ToastMessage[] =>
  page.toast.mock.calls.map(([message]) => message);

const dialogTitled = (host: HTMLElement, heading: string): HTMLDialogElement | null =>
  allByTestId(host, 'confirm-dialog')
    .filter((element): element is HTMLDialogElement => element instanceof HTMLDialogElement)
    .find((dialog) => testIdText(dialog, 'confirm-dialog-heading') === heading) ?? null;

const dialogDescription = (dialog: HTMLDialogElement | null): string => {
  const id = dialog?.getAttribute('aria-describedby');
  return id ? normalized(dialog?.ownerDocument.getElementById(id)) : '';
};

async function answer(
  page: Page,
  dialog: HTMLDialogElement | null,
  reply: 'confirm' | 'cancel' | 'escape',
): Promise<void> {
  if (reply === 'escape') dialog?.dispatchEvent(new Event('cancel', { cancelable: true }));
  else nativeButton(dialog && byTestId(dialog, `confirm-dialog-${reply}`))?.click();
  await settleBounded(page.fixture);
}

const LEAVE_HEADING = 'Quitter sans enregistrer ?';
const DELETE_HEADING = 'Supprimer cette fermeture ?';

const field = (root: ParentNode, testId: string): HTMLInputElement | null => {
  const element = byTestId(root, testId);
  return element instanceof HTMLInputElement ? element : null;
};

async function typeIn(page: Page, testId: string, text: string): Promise<void> {
  const control = field(closures(page.host), testId);
  if (control === null) return;
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  control.dispatchEvent(new Event('blur'));
  await settleBounded(page.fixture);
}

async function fillClosure(
  page: Page,
  closure: { readonly startsOn: string; readonly endsOn: string; readonly reason?: string },
): Promise<void> {
  await typeIn(page, 'admin-closure-starts-on', closure.startsOn);
  await typeIn(page, 'admin-closure-ends-on', closure.endsOn);
  if (closure.reason !== undefined) await typeIn(page, 'admin-closure-reason', closure.reason);
}

async function submitClosure(page: Page): Promise<void> {
  await press(page, closures(page.host), 'admin-closure-submit');
}

const closurePeriods = (host: HTMLElement): readonly string[] =>
  allByTestId(closures(host), 'admin-closure').map((item) =>
    testIdText(item, 'admin-closure-period'),
  );

const closureRow = (host: HTMLElement, period: string): HTMLElement | null =>
  allByTestId(closures(host), 'admin-closure').find(
    (item) => testIdText(item, 'admin-closure-period') === period,
  ) ?? null;

async function askDeletion(page: Page, period: string): Promise<void> {
  await press(page, closureRow(page.host, period), 'admin-closure-delete');
}

const CHRISTMAS_PERIOD = 'Du jeudi 24 décembre 2026 au vendredi 1er janvier 2027';
const ARMISTICE_PERIOD = 'Mercredi 11 novembre 2026';

describe('AdminAvailability: ouverture', () => {
  it('Given rules and closures When /admin/disponibilites is opened Then both are read once, the page is titled « Disponibilités » with its three sections and nothing is left to save', async () => {
    const page = await openPage();

    expect({
      crash: page.crash,
      rules: page.getAvailabilityRules.mock.calls.length,
      closures: page.getClosures.mock.calls.length,
      title: testIdText(page.host, 'admin-page-title'),
      h1: page.host.querySelectorAll('h1').length,
      sections: [...page.host.querySelectorAll('h2')]
        .filter((heading) => heading.closest('dialog') === null)
        .map((heading) => normalized(heading)),
      state: saveBarState(page),
    }).toEqual({
      crash: null,
      rules: 1,
      closures: 1,
      title: 'Disponibilités',
      h1: 1,
      sections: ['Semaine type', 'Calendrier', 'Fermetures'],
      state: 'Aucune modification',
    });
  });

  it('Given the page When the header renders Then the introduction says how the offered slots are derived', async () => {
    const page = await openPage();

    expect(normalized(byTestId(page.host, 'admin-page-title')?.nextElementSibling)).toBe(
      "Les créneaux de 30 minutes proposés sur la page de réservation découlent de ces plages, à l'heure de Paris, moins les fermetures et les rendez-vous déjà pris.",
    );
  });

  it('Given the rules When the weekly section renders Then the availability form holds the week template, Monday shown first in a grid of 26 half hours', async () => {
    const page = await openPage();
    const form = byTestId(page.host, 'admin-availability-rules');
    const template = byTestId(page.host, 'admin-week-template');

    expect({
      tag: form?.tagName,
      id: form?.id,
      inForm: template !== null && (form?.contains(template) ?? false),
      inSection: template !== null && weekly(page.host).contains(template),
      group: byTestId(weekTemplate(page.host), 'filter-group')?.getAttribute('aria-label'),
      days: dayOptions(page.host).map((option) => testIdText(option, 'filter-option-label')),
      pressed: pressedDays(page.host),
      heading: testIdText(weekTemplate(page.host), 'admin-slot-grid-heading'),
      slots: slotButtons(page.host).length,
    }).toEqual({
      tag: 'FORM',
      id: 'availability-form',
      inForm: true,
      inSection: true,
      group: 'Jour de la semaine',
      days: [...DAYS],
      pressed: ['Lundi'],
      heading: 'Créneaux du lundi',
      slots: 26,
    });
  });

  it('Given two Monday ranges and one on Wednesday When the week renders Then the summary lists every day, the counts follow and the Monday grid is pressed on its ranges', async () => {
    const page = await openPage();

    expect({
      summary: summary(page.host),
      counts: dayOptions(page.host).map((option) => testIdText(option, 'filter-option-count')),
      monday: pressedSlots(page.host),
      none: byTestId(page.host, 'admin-availability-none'),
      hidden: hiddenNotice(page.host),
    }).toEqual({
      summary: INITIAL_SUMMARY,
      counts: ['14', '0', '3', '0', '0', '0', '0'],
      monday: [
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '14:00',
        '14:30',
        '15:00',
        '15:30',
        '16:00',
        '16:30',
        '17:00',
        '17:30',
      ],
      none: null,
      hidden: null,
    });
  });

  it('Given a whole Sunday When it is shown Then its range reads from 00:00 to 24:00, the whole grid is pressed and the hours outside it are reported kept', async () => {
    const page = await openPage(
      withRules([anAvailabilityRule({ weekday: 7, startMinute: 0, endMinute: 1440 })]),
    );

    await chooseDay(page, 'Dimanche');

    expect({
      sunday: summaryOf(page.host, 'Dimanche'),
      pressed: pressedSlots(page.host),
      hidden: hiddenNotice(page.host),
      state: saveBarState(page),
    }).toEqual({
      sunday: 'Dimanche : 00:00–24:00',
      pressed: SLOT_TIMES,
      hidden: 'Conservé hors de la grille : dimanche 00:00–08:00, 21:00–24:00.',
      state: 'Aucune modification',
    });
  });

  it('Given a Monday range from 07:00 to 09:00 When the week renders Then the grid shows 08:00 and 08:30 and the hour before is reported kept outside the grid', async () => {
    const page = await openPage(withRules([EARLY_MONDAY]));

    expect({
      monday: summaryOf(page.host, 'Lundi'),
      pressed: pressedSlots(page.host),
      hidden: hiddenNotice(page.host),
      state: saveBarState(page),
    }).toEqual({
      monday: 'Lundi : 07:00–09:00',
      pressed: ['08:00', '08:30'],
      hidden: 'Conservé hors de la grille : lundi 07:00–08:00.',
      state: 'Aucune modification',
    });
  });

  it('Given no rule at all When the week renders Then a notice says the booking page offers no slot, and every day is still editable', async () => {
    const page = await openPage(withRules([]));

    expect({
      none: testIdText(page.host, 'admin-availability-none'),
      days: dayOptions(page.host).length,
      slots: slotButtons(page.host).length,
      pressed: pressedSlots(page.host),
      summary: summary(page.host),
    }).toEqual({
      none: "Aucune plage : la page de réservation n'affiche aucun créneau.",
      days: 7,
      slots: 26,
      pressed: [],
      summary: DAYS.map((label) => `${label} : aucun créneau`),
    });
  });
});

describe('AdminAvailability: chargement et erreur des plages', () => {
  it('Given the rules are loading When the page renders Then a status placeholder stands instead of the grid and the save bar', async () => {
    const page = await openPage(
      spies({ getAvailabilityRules: vi.fn<BookingGateway['getAvailabilityRules']>(() => NEVER) }),
    );
    const loading = byTestId(weekly(page.host), 'admin-availability-loading');

    expect({
      crash: page.crash,
      role: loading?.getAttribute('role'),
      form: byTestId(page.host, 'admin-availability-rules'),
      submit: byTestId(page.host, 'savebar-submit'),
    }).toEqual({ crash: null, role: 'status', form: null, submit: null });
  });

  it('Given the rules failed to load When the page renders Then the weekly section offers a retry and the closures still show', async () => {
    const page = await openPage(
      spies({
        getAvailabilityRules: vi.fn<BookingGateway['getAvailabilityRules']>(() =>
          throwError(() => new Error('down')),
        ),
      }),
    );

    expect({
      crash: page.crash,
      message: testIdText(weekly(page.host), 'load-error-message'),
      retry: nativeButton(byTestId(weekly(page.host), 'load-error-retry')) !== null,
      form: byTestId(page.host, 'admin-availability-rules'),
      submit: byTestId(page.host, 'savebar-submit'),
      closures: closurePeriods(page.host),
    }).toEqual({
      crash: null,
      message:
        "Les disponibilités n'ont pas pu être chargées. Vérifiez votre connexion, puis réessayez.",
      retry: true,
      form: null,
      submit: null,
      closures: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
    });
  });

  it('Given the rules failed to load When Réessayer is pressed Then they are read again and the week shows', async () => {
    const getAvailabilityRules = vi
      .fn<BookingGateway['getAvailabilityRules']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(RULES));
    const page = await openPage(spies({ getAvailabilityRules }));

    await press(page, weekly(page.host), 'load-error-retry');

    expect({
      calls: getAvailabilityRules.mock.calls.length,
      summary: summary(page.host),
    }).toEqual({ calls: 2, summary: INITIAL_SUMMARY });
  });
});

describe('AdminAvailability: régler la semaine type', () => {
  it('Given an empty Tuesday When 18:00 is switched on Then it is pressed, the summary and the count follow and one change is reported', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00');

    expect({
      pressed: pressedSlots(page.host),
      tuesday: summaryOf(page.host, 'Mardi'),
      count: testIdText(dayOptions(page.host)[1] ?? page.host, 'filter-option-count'),
      state: saveBarState(page),
    }).toEqual({
      pressed: ['18:00'],
      tuesday: 'Mardi : 18:00–18:30',
      count: '1',
      state: '1 modification non enregistrée',
    });
  });

  it('Given the week When another day is only shown Then nothing is left to save', async () => {
    const page = await openPage();

    await chooseDay(page, 'Mercredi');

    expect({
      pressed: pressedDays(page.host),
      heading: testIdText(weekTemplate(page.host), 'admin-slot-grid-heading'),
      slots: pressedSlots(page.host),
      state: saveBarState(page),
    }).toEqual({
      pressed: ['Mercredi'],
      heading: 'Créneaux du mercredi',
      slots: ['10:00', '10:30', '11:00'],
      state: 'Aucune modification',
    });
  });

  it('Given Tuesday When 18:00 and 18:30 are switched on Then the day reads one range and still counts as one change', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00', '18:30');

    expect({ tuesday: summaryOf(page.host, 'Mardi'), state: saveBarState(page) }).toEqual({
      tuesday: 'Mardi : 18:00–19:00',
      state: '1 modification non enregistrée',
    });
  });

  it('Given the Monday morning When 09:00 is switched off Then the morning starts at 09:30', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Lundi', '09:00');

    expect({ monday: summaryOf(page.host, 'Lundi'), state: saveBarState(page) }).toEqual({
      monday: 'Lundi : 09:30–12:00, 14:00–18:00',
      state: '1 modification non enregistrée',
    });
  });

  it('Given the only Wednesday range When its three half hours are switched off Then the day says it offers no slot', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mercredi', '10:00', '10:30', '11:00');

    expect({
      wednesday: summaryOf(page.host, 'Mercredi'),
      pressed: pressedSlots(page.host),
      count: testIdText(dayOptions(page.host)[2] ?? page.host, 'filter-option-count'),
    }).toEqual({ wednesday: 'Mercredi : aucun créneau', pressed: [], count: '0' });
  });

  it('Given Monday and Thursday edited When the bar renders Then it reports two changes', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Lundi', '12:00');
    await toggleSlots(page, 'Jeudi', '09:00');

    expect({
      monday: summaryOf(page.host, 'Lundi'),
      thursday: summaryOf(page.host, 'Jeudi'),
      state: saveBarState(page),
    }).toEqual({
      monday: 'Lundi : 09:00–12:30, 14:00–18:00',
      thursday: 'Jeudi : 09:00–09:30',
      state: '2 modifications non enregistrées',
    });
  });

  it('Given a half hour switched on on Tuesday When it is switched off again Then nothing is left to save', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00', '18:00');

    expect({ tuesday: summaryOf(page.host, 'Mardi'), state: saveBarState(page) }).toEqual({
      tuesday: 'Mardi : aucun créneau',
      state: 'Aucune modification',
    });
  });
});

describe('AdminAvailability: fusion des plages', () => {
  it('Given the two Monday ranges When the hours between them are switched on Then the day reads one range and a single Monday rule is sent', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Lundi', '12:00', '12:30', '13:00', '13:30');
    const monday = summaryOf(page.host, 'Lundi');
    await save(page);

    expect({
      monday,
      calls: page.replaceAvailabilityRules.mock.calls,
      alerts: weekly(page.host).querySelectorAll('[role="alert"]').length,
      toasts: toasts(page),
    }).toEqual({
      monday: 'Lundi : 09:00–18:00',
      calls: [
        [
          [
            { weekday: 1, startMinute: 540, endMinute: 1080 },
            { weekday: 3, startMinute: 600, endMinute: 690 },
          ],
        ],
      ],
      alerts: 0,
      toasts: [{ severity: 'success', detail: 'Disponibilités enregistrées' }],
    });
  });

  it('Given 09:00–10:00 and 10:00–11:00 read on Thursday When the week renders and is saved Then they show and are sent as one range 09:00–11:00', async () => {
    const page = await openPage(
      withRules([
        anAvailabilityRule({ weekday: 4, startMinute: 540, endMinute: 600 }),
        anAvailabilityRule({ weekday: 4, startMinute: 600, endMinute: 660 }),
      ]),
    );
    const thursday = summaryOf(page.host, 'Jeudi');
    const state = saveBarState(page);

    await toggleSlots(page, 'Mardi', '18:00');
    await save(page);

    expect({ thursday, state, sent: page.replaceAvailabilityRules.mock.calls }).toEqual({
      thursday: 'Jeudi : 09:00–11:00',
      state: 'Aucune modification',
      sent: [
        [
          [
            { weekday: 2, startMinute: 1080, endMinute: 1110 },
            { weekday: 4, startMinute: 540, endMinute: 660 },
          ],
        ],
      ],
    });
  });
});

describe('AdminAvailability: enregistrer', () => {
  it('Given the grid When the bar renders Then « Enregistrer » submits the availability form and « Annuler » leads to the overview', async () => {
    const page = await openPage();
    const button = nativeButton(byTestId(page.host, 'savebar-submit'));

    expect({
      type: button?.type,
      form: button?.getAttribute('form'),
      formExists: page.host.querySelector('form#availability-form') !== null,
      cancel: byTestId(page.host, 'savebar-cancel')?.getAttribute('href'),
    }).toEqual({ type: 'submit', form: 'availability-form', formExists: true, cancel: '/admin' });
  });

  it('Given 18:00 and 18:30 switched on on Tuesday When it is saved Then the whole week is sent once, success is told and nothing is left to save', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00', '18:30');
    await save(page);

    expect({
      calls: page.replaceAvailabilityRules.mock.calls,
      toasts: toasts(page),
      state: saveBarState(page),
      tuesday: summaryOf(page.host, 'Mardi'),
    }).toEqual({
      calls: [
        [
          [
            { weekday: 1, startMinute: 540, endMinute: 720 },
            { weekday: 1, startMinute: 840, endMinute: 1080 },
            { weekday: 2, startMinute: 1080, endMinute: 1140 },
            { weekday: 3, startMinute: 600, endMinute: 690 },
          ],
        ],
      ],
      toasts: [{ severity: 'success', detail: 'Disponibilités enregistrées' }],
      state: 'Aucune modification',
      tuesday: 'Mardi : 18:00–19:00',
    });
  });

  it('Given a Monday range starting at 07:00 When Tuesday is edited and saved Then the hour outside the grid is sent untouched', async () => {
    const page = await openPage(withRules([EARLY_MONDAY]));

    await toggleSlots(page, 'Mardi', '18:00');
    await save(page);

    expect(page.replaceAvailabilityRules.mock.calls).toEqual([
      [
        [
          { weekday: 1, startMinute: 420, endMinute: 540 },
          { weekday: 2, startMinute: 1080, endMinute: 1110 },
        ],
      ],
    ]);
  });

  it('Given a Monday range from 07:00 to 09:00 When its two half hours in the grid are switched off and saved Then 07:00–08:00 is still sent and still reported', async () => {
    const page = await openPage(withRules([EARLY_MONDAY]));

    await toggleSlots(page, 'Lundi', '08:00', '08:30');
    await save(page);

    expect({
      sent: page.replaceAvailabilityRules.mock.calls,
      hidden: hiddenNotice(page.host),
      monday: summaryOf(page.host, 'Lundi'),
    }).toEqual({
      sent: [[[{ weekday: 1, startMinute: 420, endMinute: 480 }]]],
      hidden: 'Conservé hors de la grille : lundi 07:00–08:00.',
      monday: 'Lundi : 07:00–08:00',
    });
  });

  it('Given the API answers the stored week When the save succeeds Then the week shows the answer with nothing left to save', async () => {
    const page = await openPage(
      spies({
        replaceAvailabilityRules: vi.fn<BookingGateway['replaceAvailabilityRules']>(() =>
          of({
            success: true,
            data: [anAvailabilityRule({ weekday: 2, startMinute: 1080, endMinute: 1200 })],
          } as const),
        ),
      }),
    );

    await toggleSlots(page, 'Mardi', '18:00');
    await save(page);

    expect({ summary: summary(page.host), state: saveBarState(page) }).toEqual({
      summary: [
        'Lundi : aucun créneau',
        'Mardi : 18:00–20:00',
        'Mercredi : aucun créneau',
        'Jeudi : aucun créneau',
        'Vendredi : aucun créneau',
        'Samedi : aucun créneau',
        'Dimanche : aucun créneau',
      ],
      state: 'Aucune modification',
    });
  });

  it('Given every half hour switched off When it is saved Then an empty week is sent', async () => {
    const page = await openPage();

    await toggleSlots(
      page,
      'Lundi',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
    );
    await toggleSlots(page, 'Mercredi', '10:00', '10:30', '11:00');
    await save(page);

    expect(page.replaceAvailabilityRules.mock.calls).toEqual([[[]]]);
  });

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    {
      reason: 'invalid',
      detail: 'Les plages ont été refusées : vérifiez les heures, puis réessayez.',
    },
    {
      reason: 'network',
      detail: 'Enregistrement impossible : vérifiez votre connexion, puis réessayez.',
    },
    {
      reason: 'server',
      detail: "Enregistrement impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
  ])(
    'Given the API answers $reason When the week is saved Then « $detail » is told and the draft is kept',
    async ({ reason, detail }) => {
      const page = await openPage(
        spies({
          replaceAvailabilityRules: vi.fn<BookingGateway['replaceAvailabilityRules']>(() =>
            of({ success: false, reason }),
          ),
        }),
      );

      await toggleSlots(page, 'Mardi', '18:00');
      await save(page);

      expect({
        calls: page.replaceAvailabilityRules.mock.calls.length,
        toasts: toasts(page),
        tuesday: summaryOf(page.host, 'Mardi'),
        state: saveBarState(page),
        disabled: nativeButton(byTestId(page.host, 'savebar-submit'))?.disabled,
      }).toEqual({
        calls: 1,
        toasts: [{ severity: 'error', detail }],
        tuesday: 'Mardi : 18:00–18:30',
        state: '1 modification non enregistrée',
        disabled: false,
      });
    },
  );

  it('Given a save in progress When the bar renders Then « Enregistrer » is disabled until the answer', async () => {
    const page = await openPage(
      spies({
        replaceAvailabilityRules: vi.fn<BookingGateway['replaceAvailabilityRules']>(() => NEVER),
      }),
    );

    await toggleSlots(page, 'Mardi', '18:00');
    await save(page);

    expect({
      calls: page.replaceAvailabilityRules.mock.calls.length,
      disabled: nativeButton(byTestId(page.host, 'savebar-submit'))?.disabled,
    }).toEqual({ calls: 1, disabled: true });
  });
});

describe('AdminAvailability: quitter la page', () => {
  it('Given no change When « Annuler » is followed Then the overview opens without question', async () => {
    const page = await openPage();

    await leaveByCancel(page);

    expect({
      dialog: dialogTitled(page.host, LEAVE_HEADING)?.open ?? false,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: false, url: '/admin' });
  });

  it('Given an unsaved change When the admin leaves Then a dialog asks to confirm, names the availability, and the page stays meanwhile', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00');
    await leaveByCancel(page);
    const dialog = dialogTitled(page.host, LEAVE_HEADING);

    expect({
      open: dialog?.open,
      description: dialogDescription(dialog),
      url: TestBed.inject(Router).url,
    }).toEqual({
      open: true,
      description: 'Les modifications non enregistrées des disponibilités seront perdues.',
      url: '/admin/disponibilites',
    });
  });

  it.each([
    { reply: 'confirm', url: '/admin', tuesday: null },
    { reply: 'cancel', url: '/admin/disponibilites', tuesday: 'Mardi : 18:00–18:30' },
  ] as const)(
    'Given the leave dialog When the admin answers $reply Then the address is $url',
    async ({ reply, url, tuesday }) => {
      const page = await openPage();

      await toggleSlots(page, 'Mardi', '18:00');
      await leaveByCancel(page);
      await answer(page, dialogTitled(page.host, LEAVE_HEADING), reply);

      expect({
        url: TestBed.inject(Router).url,
        open: dialogTitled(page.host, LEAVE_HEADING)?.open ?? false,
        tuesday: byTestId(page.host, 'admin-week-template') ? summaryOf(page.host, 'Mardi') : null,
      }).toEqual({ url, open: false, tuesday });
    },
  );

  it('Given an edited week saved When the admin leaves Then no dialog is asked', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00');
    await save(page);
    await leaveByCancel(page);

    expect({
      saved: page.replaceAvailabilityRules.mock.calls.length,
      url: TestBed.inject(Router).url,
    }).toEqual({ saved: 1, url: '/admin' });
  });

  it('Given the tab about to close When the week is untouched then edited Then the browser warning is requested only once edited', async () => {
    const page = await openPage();
    const untouched = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(untouched);

    await toggleSlots(page, 'Mardi', '18:00');
    const edited = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(edited);

    expect({ untouched: untouched.defaultPrevented, edited: edited.defaultPrevented }).toEqual({
      untouched: false,
      edited: true,
    });
  });
});

describe('AdminAvailability: liste des fermetures', () => {
  it('Given two closures When the section renders Then they are listed in order with their Paris dates, a single day alone, and their reason when given', async () => {
    const page = await openPage();
    const list = byTestId(closures(page.host), 'admin-closures-list');

    expect({
      tag: list?.tagName,
      role: list?.getAttribute('role'),
      items: [...(list?.children ?? [])].map((item) => item.tagName),
      periods: closurePeriods(page.host),
      reasons: allByTestId(closures(page.host), 'admin-closure').map((item) => {
        const reason = byTestId(item, 'admin-closure-row-reason');
        return reason === null ? null : normalized(reason);
      }),
    }).toEqual({
      tag: 'UL',
      role: 'list',
      items: ['LI', 'LI'],
      periods: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
      reasons: [null, "Congés de fin d'année"],
    });
  });

  it('Given two closures When the section renders Then each delete button names its closure', async () => {
    const page = await openPage();

    expect(
      allByTestId(closures(page.host), 'admin-closure-delete').map((button) => ({
        type: nativeButton(button)?.type,
        name: accessibleName(nativeButton(button) ?? button, page.host),
      })),
    ).toEqual([
      { type: 'button', name: 'Supprimer la fermeture du mercredi 11 novembre 2026' },
      {
        type: 'button',
        name: 'Supprimer la fermeture du jeudi 24 décembre 2026 au vendredi 1er janvier 2027',
      },
    ]);
  });

  it('Given the closures are loading When the section renders Then a status placeholder stands instead of the list', async () => {
    const page = await openPage(
      spies({ getClosures: vi.fn<BookingGateway['getClosures']>(() => NEVER) }),
    );

    expect({
      crash: page.crash,
      role: byTestId(closures(page.host), 'admin-closures-loading')?.getAttribute('role'),
      list: byTestId(page.host, 'admin-closures-list'),
      grid: byTestId(page.host, 'admin-availability-rules') !== null,
    }).toEqual({ crash: null, role: 'status', list: null, grid: true });
  });

  it('Given the closures failed to load When Réessayer is pressed Then they are read again and listed', async () => {
    const getClosures = vi
      .fn<BookingGateway['getClosures']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of([CHRISTMAS]));
    const page = await openPage(spies({ getClosures }));
    const message = testIdText(closures(page.host), 'load-error-message');
    const grid = byTestId(page.host, 'admin-availability-rules') !== null;

    await press(page, closures(page.host), 'load-error-retry');

    expect({
      message,
      grid,
      calls: getClosures.mock.calls.length,
      periods: closurePeriods(page.host),
    }).toEqual({
      message:
        "Les fermetures n'ont pas pu être chargées. Vérifiez votre connexion, puis réessayez.",
      grid: true,
      calls: 2,
      periods: [CHRISTMAS_PERIOD],
    });
  });

  it('Given no closure When the section renders Then it says so and the add form is offered', async () => {
    const page = await openPage(
      spies({ getClosures: vi.fn<BookingGateway['getClosures']>(() => of([])) }),
    );

    expect({
      empty: testIdText(closures(page.host), 'admin-closures-empty'),
      list: byTestId(page.host, 'admin-closures-list'),
      form: field(closures(page.host), 'admin-closure-starts-on') !== null,
    }).toEqual({ empty: 'Aucune fermeture à venir.', list: null, form: true });
  });
});

describe('AdminAvailability: ajouter une fermeture', () => {
  it('Given the add form When it renders Then it has two native date fields and an optional reason, all labelled, in a form of its own', async () => {
    const page = await openPage();
    const section = closures(page.host);
    const starts = field(section, 'admin-closure-starts-on');
    const ends = field(section, 'admin-closure-ends-on');
    const reason = field(section, 'admin-closure-reason');
    const submit = nativeButton(byTestId(section, 'admin-closure-submit'));

    expect({
      starts: {
        type: starts?.type,
        label: labelOf(page.host, starts),
        required: starts?.getAttribute('aria-required'),
      },
      ends: {
        type: ends?.type,
        label: labelOf(page.host, ends),
        required: ends?.getAttribute('aria-required'),
      },
      reason: {
        label: labelOf(page.host, reason),
        maxLength: reason?.maxLength,
        required: reason?.getAttribute('aria-required') ?? null,
      },
      submit: {
        type: submit?.type,
        text: normalized(submit),
        ownForm: submit?.form !== null && submit?.form?.id !== 'availability-form',
      },
      nested: page.host.querySelectorAll('form form').length,
    }).toEqual({
      starts: { type: 'date', label: 'Premier jour', required: 'true' },
      ends: { type: 'date', label: 'Dernier jour', required: 'true' },
      reason: { label: 'Motif (facultatif)', maxLength: 500, required: null },
      submit: { type: 'submit', text: 'Ajouter la fermeture', ownForm: true },
      nested: 0,
    });
  });

  it('Given a period and a reason with spaces around When the closure is added Then it is sent trimmed, inserted in date order, success is told and the form is emptied', async () => {
    const page = await openPage();

    await fillClosure(page, { startsOn: '2026-12-01', endsOn: '2026-12-02', reason: '  Salon  ' });
    await submitClosure(page);
    const section = closures(page.host);

    expect({
      calls: page.createClosure.mock.calls,
      periods: closurePeriods(page.host),
      toasts: toasts(page),
      values: ['admin-closure-starts-on', 'admin-closure-ends-on', 'admin-closure-reason'].map(
        (testId) => field(section, testId)?.value,
      ),
      errors: section.querySelectorAll('[role="alert"]').length,
      rules: page.replaceAvailabilityRules.mock.calls.length,
      state: saveBarState(page),
    }).toEqual({
      calls: [[{ startsOn: '2026-12-01', endsOn: '2026-12-02', reason: 'Salon' }]],
      periods: [
        ARMISTICE_PERIOD,
        'Du mardi 1er décembre 2026 au mercredi 2 décembre 2026',
        CHRISTMAS_PERIOD,
      ],
      toasts: [{ severity: 'success', detail: 'Fermeture ajoutée' }],
      values: ['', '', ''],
      errors: 0,
      rules: 0,
      state: 'Aucune modification',
    });
  });

  it.each([
    { case: 'a blank reason', reason: '   ' },
    { case: 'no reason', reason: undefined },
  ])(
    'Given a single day and $case When the closure is added Then the reason is sent as null',
    async ({ reason }) => {
      const page = await openPage();

      await fillClosure(page, { startsOn: '2026-11-02', endsOn: '2026-11-02', reason });
      await submitClosure(page);

      expect({
        calls: page.createClosure.mock.calls,
        periods: closurePeriods(page.host),
      }).toEqual({
        calls: [[{ startsOn: '2026-11-02', endsOn: '2026-11-02', reason: null }]],
        periods: ['Lundi 2 novembre 2026', ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
      });
    },
  );

  it('Given the add form When a reason is typed Then the weekly draft counts no change', async () => {
    const page = await openPage();

    await typeIn(page, 'admin-closure-reason', 'Salon');

    expect(saveBarState(page)).toBe('Aucune modification');
  });

  it('Given the empty form When « Ajouter la fermeture » is pressed Then nothing is sent and both dates ask to be chosen', async () => {
    const page = await openPage();

    await submitClosure(page);
    const section = closures(page.host);

    expect({
      calls: page.createClosure.mock.calls.length,
      starts: testIdText(section, 'admin-closure-starts-on-error'),
      ends: testIdText(section, 'admin-closure-ends-on-error'),
    }).toEqual({
      calls: 0,
      starts: 'Choisissez le premier jour',
      ends: 'Choisissez le dernier jour',
    });
  });

  it('Given a last day before the first When the closure is added Then nothing is sent and the last day says it cannot precede the first', async () => {
    const page = await openPage();

    await fillClosure(page, { startsOn: '2026-12-10', endsOn: '2026-12-09' });
    await submitClosure(page);
    const section = closures(page.host);
    const ends = field(section, 'admin-closure-ends-on');
    const error = byTestId(section, 'admin-closure-ends-on-error');

    expect({
      calls: page.createClosure.mock.calls.length,
      message: normalized(error),
      role: error?.getAttribute('role'),
      invalid: ends?.getAttribute('aria-invalid'),
      starts: byTestId(section, 'admin-closure-starts-on-error'),
    }).toEqual({
      calls: 0,
      message: 'Le dernier jour ne peut pas précéder le premier',
      role: 'alert',
      invalid: 'true',
      starts: null,
    });
  });

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    {
      reason: 'invalid',
      detail: 'La fermeture a été refusée : vérifiez les dates, puis réessayez.',
    },
    {
      reason: 'network',
      detail: 'Ajout impossible : vérifiez votre connexion, puis réessayez.',
    },
    {
      reason: 'server',
      detail: "Ajout impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
  ])(
    'Given the API answers $reason When the closure is added Then « $detail » is told, the list is unchanged and the form keeps its values',
    async ({ reason, detail }) => {
      const page = await openPage(
        spies({
          createClosure: vi.fn<BookingGateway['createClosure']>(() =>
            of({ success: false, reason }),
          ),
        }),
      );

      await fillClosure(page, { startsOn: '2026-12-01', endsOn: '2026-12-02', reason: 'Salon' });
      await submitClosure(page);
      const section = closures(page.host);

      expect({
        toasts: toasts(page),
        periods: closurePeriods(page.host),
        values: ['admin-closure-starts-on', 'admin-closure-ends-on', 'admin-closure-reason'].map(
          (testId) => field(section, testId)?.value,
        ),
      }).toEqual({
        toasts: [{ severity: 'error', detail }],
        periods: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
        values: ['2026-12-01', '2026-12-02', 'Salon'],
      });
    },
  );
});

describe('AdminAvailability: supprimer une fermeture', () => {
  it('Given the Christmas closure When its delete button is pressed Then a dialog names the period, and nothing is deleted yet', async () => {
    const page = await openPage();

    await askDeletion(page, CHRISTMAS_PERIOD);
    const dialog = dialogTitled(page.host, DELETE_HEADING);

    expect({
      open: dialog?.open,
      description: dialogDescription(dialog),
      confirm: testIdText(dialog ?? page.host, 'confirm-dialog-confirm'),
      cancel: testIdText(dialog ?? page.host, 'confirm-dialog-cancel'),
      calls: page.deleteClosure.mock.calls.length,
    }).toEqual({
      open: true,
      description: `${CHRISTMAS_PERIOD}. Les créneaux redeviennent réservables.`,
      confirm: 'Supprimer la fermeture',
      cancel: 'Garder la fermeture',
      calls: 0,
    });
  });

  it('Given the delete dialog When it is confirmed Then that closure is deleted, its row goes, success is told and the focus lands on the section title', async () => {
    const page = await openPage();

    await askDeletion(page, CHRISTMAS_PERIOD);
    await answer(page, dialogTitled(page.host, DELETE_HEADING), 'confirm');
    const heading = byTestId(page.host, 'admin-closures-heading');

    expect({
      calls: page.deleteClosure.mock.calls,
      periods: closurePeriods(page.host),
      toasts: toasts(page),
      open: dialogTitled(page.host, DELETE_HEADING)?.open ?? false,
      heading: normalized(heading),
      focused: heading !== null && page.host.ownerDocument.activeElement === heading,
    }).toEqual({
      calls: [['c-noel']],
      periods: [ARMISTICE_PERIOD],
      toasts: [{ severity: 'success', detail: 'Fermeture supprimée' }],
      open: false,
      heading: 'Fermetures',
      focused: true,
    });
  });

  it.each(['cancel', 'escape'] as const)(
    'Given the delete dialog When the admin answers %s Then nothing is deleted and the row stays',
    async (reply) => {
      const page = await openPage();

      await askDeletion(page, CHRISTMAS_PERIOD);
      await answer(page, dialogTitled(page.host, DELETE_HEADING), reply);

      expect({
        calls: page.deleteClosure.mock.calls.length,
        periods: closurePeriods(page.host),
        open: dialogTitled(page.host, DELETE_HEADING)?.open ?? false,
      }).toEqual({ calls: 0, periods: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD], open: false });
    },
  );

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    { reason: 'not-found', detail: "Cette fermeture n'existe plus. Rechargez la page." },
    {
      reason: 'network',
      detail: 'Suppression impossible : vérifiez votre connexion, puis réessayez.',
    },
    {
      reason: 'server',
      detail: "Suppression impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
  ])(
    'Given the API answers $reason When the deletion is confirmed Then the row stays and « $detail » is told',
    async ({ reason, detail }) => {
      const page = await openPage(
        spies({
          deleteClosure: vi.fn<BookingGateway['deleteClosure']>(
            (): Observable<{ readonly success: false; readonly reason: BookingAdminFailure }> =>
              of({ success: false, reason }),
          ),
        }),
      );

      await askDeletion(page, CHRISTMAS_PERIOD);
      await answer(page, dialogTitled(page.host, DELETE_HEADING), 'confirm');

      expect({ periods: closurePeriods(page.host), toasts: toasts(page) }).toEqual({
        periods: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
        toasts: [{ severity: 'error', detail }],
      });
    },
  );
});

const calendar = (host: HTMLElement): HTMLElement => byTestId(host, 'admin-calendar') ?? host;

const calendarDays = (host: HTMLElement): readonly HTMLElement[] =>
  allByTestId(calendar(host), 'admin-calendar-day');

const calendarDayOn = (host: HTMLElement, date: string): HTMLElement | null =>
  calendarDays(host)[Number(date.slice(8)) - 1] ?? null;

const monthLabel = (host: HTMLElement): string =>
  testIdText(calendar(host), 'admin-calendar-month-label');

const calendarTabStops = (host: HTMLElement): readonly string[] =>
  calendarDays(host)
    .filter((day) => day.getAttribute('tabindex') === '0')
    .map((day) => accessibleName(day, host));

const focusedDay = (host: HTMLElement): string | null => {
  const focused = host.ownerDocument.activeElement;
  return focused instanceof HTMLElement && calendar(host).contains(focused)
    ? accessibleName(focused, host)
    : null;
};

const isUnavailable = (button: HTMLElement | null): boolean =>
  button instanceof HTMLButtonElement &&
  (button.disabled || button.getAttribute('aria-disabled') === 'true');

async function pressKeyOn(page: Page, date: string, key: string): Promise<void> {
  const day = calendarDayOn(page.host, date);
  day?.focus();
  day?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await settleBounded(page.fixture);
}

const withCalendar = (read: BookingGateway['getAvailabilityCalendar']): Spies =>
  spies({
    getAvailabilityCalendar: vi.fn<BookingGateway['getAvailabilityCalendar']>(read),
  });

const CALENDAR_HELP =
  'Cliquez un jour, ou Entrée et Espace, pour le fermer ou le rouvrir. Flèches : jour voisin ; Page précédente et Page suivante : mois voisin.';

describe('AdminAvailability: calendrier du mois', () => {
  it('Given the screen When it opens Then the current month is read once without naming it, in a « Calendrier » section between the weekly template and the closures', async () => {
    const page = await openPage();
    const section = byTestId(page.host, 'admin-calendar');
    const weeklySection = byTestId(page.host, 'admin-availability-weekly');
    const closuresSection = byTestId(page.host, 'admin-closures');
    const follows = (first: Node | null, second: Node | null): boolean =>
      first !== null &&
      second !== null &&
      (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    expect({
      crash: page.crash,
      calls: page.getAvailabilityCalendar.mock.calls,
      tag: section?.tagName,
      labelledBy: section?.getAttribute('aria-labelledby'),
      heading: testIdText(calendar(page.host), 'admin-calendar-heading'),
      headingTag: byTestId(calendar(page.host), 'admin-calendar-heading')?.tagName,
      afterWeekly: follows(weeklySection, section),
      beforeClosures: follows(section, closuresSection),
    }).toEqual({
      crash: null,
      calls: [[null]],
      tag: 'SECTION',
      labelledBy: 'admin-calendar-heading',
      heading: 'Calendrier',
      headingTag: 'H2',
      afterWeekly: true,
      beforeClosures: true,
    });
  });

  it('Given November 2026 When the calendar renders Then the grid is named by the live month label, described by the visible help, and lists the 30 days', async () => {
    const page = await openPage();
    const grid = byTestId(calendar(page.host), 'admin-calendar-grid');
    const label = byTestId(calendar(page.host), 'admin-calendar-month-label');
    const help = byTestId(calendar(page.host), 'admin-calendar-help');

    expect({
      month: monthLabel(page.host),
      labelId: label?.id,
      live: label?.getAttribute('aria-live'),
      gridName: grid ? accessibleName(grid, page.host) : null,
      role: grid?.getAttribute('role'),
      help: normalized(help),
      helpId: help?.id,
      describedBy: grid?.getAttribute('aria-describedby'),
      days: calendarDays(page.host).length,
      stops: calendarTabStops(page.host),
      loading: byTestId(calendar(page.host), 'admin-calendar-loading'),
      error: byTestId(calendar(page.host), 'load-error'),
    }).toEqual({
      month: 'Novembre 2026',
      labelId: 'admin-calendar-month-label',
      live: 'polite',
      gridName: 'Novembre 2026',
      role: 'grid',
      help: CALENDAR_HELP,
      helpId: 'admin-calendar-help',
      describedBy: 'admin-calendar-help',
      days: 30,
      stops: ['mardi 10 novembre 2026, ouvert, 4 créneaux'],
      loading: null,
      error: null,
    });
  });

  it('Given the calendar When its legend renders Then it lists the six states in a list, each with its label and the icon of the grid', async () => {
    const page = await openPage();
    const legend = byTestId(calendar(page.host), 'admin-calendar-legend');
    const items = allByTestId(legend ?? page.host, 'admin-calendar-legend-item');
    const itemOf = (state: string): HTMLElement | undefined =>
      items.find((item) => item.getAttribute('data-state') === state);
    const iconOf = (state: string): readonly string[] =>
      [...(itemOf(state)?.querySelectorAll('use') ?? [])].map(
        (use) => use.getAttribute('href')?.split('#')[1] ?? '',
      );

    expect({
      tag: legend?.tagName,
      role: legend?.getAttribute('role'),
      states: items.map((item) => item.getAttribute('data-state')).sort(),
      labels: ['past', 'closed', 'holiday', 'closed-period'].map((state) =>
        collapsed(itemOf(state)),
      ),
      icons: [iconOf('closed'), iconOf('holiday'), iconOf('closed-period')],
    }).toEqual({
      tag: 'UL',
      role: 'list',
      states: ['closed', 'closed-period', 'empty', 'holiday', 'open', 'past'],
      labels: ['Passé', 'Fermé', 'Férié', 'Période'],
      icons: [['solid-lock'], ['solid-flag'], ['solid-calendar-days']],
    });
  });

  it('Given November When « Mois suivant » is pressed Then December is read by name and shown, its 1st as the tab stop', async () => {
    const page = await openPage();
    const next = byTestId(calendar(page.host), 'admin-calendar-next');

    await press(page, calendar(page.host), 'admin-calendar-next');

    expect({
      name: next ? accessibleName(next, page.host) : null,
      calls: page.getAvailabilityCalendar.mock.calls,
      month: monthLabel(page.host),
      days: calendarDays(page.host).length,
      stops: calendarTabStops(page.host),
    }).toEqual({
      name: 'Mois suivant',
      calls: [[null], ['2026-12']],
      month: 'Décembre 2026',
      days: 31,
      stops: ['mardi 1er décembre 2026, ouvert, 4 créneaux'],
    });
  });

  it('Given December When « Mois précédent » is pressed Then November is read by name and shown', async () => {
    const page = await openPage();

    await press(page, calendar(page.host), 'admin-calendar-next');
    const previous = byTestId(calendar(page.host), 'admin-calendar-previous');
    await press(page, calendar(page.host), 'admin-calendar-previous');

    expect({
      name: previous ? accessibleName(previous, page.host) : null,
      calls: page.getAvailabilityCalendar.mock.calls,
      month: monthLabel(page.host),
    }).toEqual({
      name: 'Mois précédent',
      calls: [[null], ['2026-12'], ['2026-11']],
      month: 'Novembre 2026',
    });
  });

  it('Given the current month When « Mois précédent » is pressed Then it is unavailable and nothing is read', async () => {
    const page = await openPage();
    const previous = nativeButton(byTestId(calendar(page.host), 'admin-calendar-previous'));

    await press(page, calendar(page.host), 'admin-calendar-previous');

    expect({
      present: previous !== null,
      unavailable: isUnavailable(previous),
      calls: page.getAvailabilityCalendar.mock.calls.length,
      month: monthLabel(page.host),
    }).toEqual({ present: true, unavailable: true, calls: 1, month: 'Novembre 2026' });
  });

  it('Given the last month allowed When « Mois suivant » is pressed Then it is unavailable and nothing more is read', async () => {
    const page = await openPage();

    await press(page, calendar(page.host), 'admin-calendar-next');
    await press(page, calendar(page.host), 'admin-calendar-next');
    const next = nativeButton(byTestId(calendar(page.host), 'admin-calendar-next'));
    await press(page, calendar(page.host), 'admin-calendar-next');

    expect({
      unavailable: isUnavailable(next),
      calls: page.getAvailabilityCalendar.mock.calls,
      month: monthLabel(page.host),
    }).toEqual({
      unavailable: true,
      calls: [[null], ['2026-12'], ['2027-01']],
      month: 'Janvier 2027',
    });
  });
});

describe('AdminAvailability: calendrier au clavier', () => {
  it('Given the 12 November focused When PageDown is pressed Then December is read and the focus lands on 12 December', async () => {
    const page = await openPage();

    await pressKeyOn(page, '2026-11-12', 'PageDown');

    expect({
      calls: page.getAvailabilityCalendar.mock.calls,
      month: monthLabel(page.host),
      focused: focusedDay(page.host),
      stops: calendarTabStops(page.host),
    }).toEqual({
      calls: [[null], ['2026-12']],
      month: 'Décembre 2026',
      focused: 'samedi 12 décembre 2026, ouvert, 4 créneaux',
      stops: ['samedi 12 décembre 2026, ouvert, 4 créneaux'],
    });
  });

  it('Given December on its way after PageDown When it is not answered yet Then November stays in a busy grid, without the loading placeholder, then December takes the focus', async () => {
    const december = new Subject<CalendarMonth>();
    const page = await openPage(
      withCalendar((month) => (month === '2026-12' ? december : of(calendarMonth(month)))),
    );

    await pressKeyOn(page, '2026-11-12', 'PageDown');
    const grid = (): HTMLElement | null => byTestId(calendar(page.host), 'admin-calendar-grid');
    const meanwhile = {
      month: monthLabel(page.host),
      busy: grid()?.getAttribute('aria-busy'),
      days: calendarDays(page.host).length,
      loading: byTestId(calendar(page.host), 'admin-calendar-loading'),
    };
    december.next(DECEMBER);
    december.complete();
    await settleBounded(page.fixture);

    expect({
      meanwhile,
      after: {
        month: monthLabel(page.host),
        busy: grid()?.getAttribute('aria-busy') === 'true',
        focused: focusedDay(page.host),
      },
    }).toEqual({
      meanwhile: { month: 'Novembre 2026', busy: 'true', days: 30, loading: null },
      after: {
        month: 'Décembre 2026',
        busy: false,
        focused: 'samedi 12 décembre 2026, ouvert, 4 créneaux',
      },
    });
  });

  it('Given December reached by keyboard When PageUp is pressed on the 12th Then November is read by name and the focus lands on 12 November', async () => {
    const page = await openPage();

    await pressKeyOn(page, '2026-11-12', 'PageDown');
    await pressKeyOn(page, '2026-12-12', 'PageUp');

    expect({
      calls: page.getAvailabilityCalendar.mock.calls,
      month: monthLabel(page.host),
      focused: focusedDay(page.host),
    }).toEqual({
      calls: [[null], ['2026-12'], ['2026-11']],
      month: 'Novembre 2026',
      focused: 'jeudi 12 novembre 2026, ouvert, 4 créneaux',
    });
  });

  it('Given the current month When PageUp is pressed on the 12th Then nothing is read and the focus stays', async () => {
    const page = await openPage();

    await pressKeyOn(page, '2026-11-12', 'PageUp');

    expect({
      calls: page.getAvailabilityCalendar.mock.calls.length,
      month: monthLabel(page.host),
      focused: focusedDay(page.host),
    }).toEqual({
      calls: 1,
      month: 'Novembre 2026',
      focused: 'jeudi 12 novembre 2026, ouvert, 4 créneaux',
    });
  });

  it('Given the 10 November focused When ArrowRight is pressed Then the holiday next to it takes the focus', async () => {
    const page = await openPage();

    await pressKeyOn(page, '2026-11-10', 'ArrowRight');

    expect({
      focused: focusedDay(page.host),
      stops: calendarTabStops(page.host),
      calls: page.getAvailabilityCalendar.mock.calls.length,
    }).toEqual({
      focused: 'mercredi 11 novembre 2026, férié (Armistice 1918), fermé',
      stops: ['mercredi 11 novembre 2026, férié (Armistice 1918), fermé'],
      calls: 1,
    });
  });
});

describe('AdminAvailability: chargement et erreur du calendrier', () => {
  it('Given the month is loading When the page renders Then a status placeholder stands in the calendar section, without a grid, and the other sections still show', async () => {
    const page = await openPage(withCalendar(() => NEVER));
    const loading = byTestId(calendar(page.host), 'admin-calendar-loading');

    expect({
      crash: page.crash,
      present: byTestId(page.host, 'admin-calendar') !== null,
      role: loading?.getAttribute('role'),
      grid: byTestId(calendar(page.host), 'admin-calendar-grid'),
      week: byTestId(page.host, 'admin-week-template') !== null,
      closures: closurePeriods(page.host),
    }).toEqual({
      crash: null,
      present: true,
      role: 'status',
      grid: null,
      week: true,
      closures: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
    });
  });

  it('Given the month failed to load When the page renders Then the calendar section alerts with a retry, without a grid, and the other sections still show', async () => {
    const page = await openPage(withCalendar(() => throwError(() => new Error('down'))));
    const error = byTestId(calendar(page.host), 'load-error');

    expect({
      crash: page.crash,
      present: byTestId(page.host, 'admin-calendar') !== null,
      role: error?.getAttribute('role'),
      retry: nativeButton(byTestId(calendar(page.host), 'load-error-retry')) !== null,
      grid: byTestId(calendar(page.host), 'admin-calendar-grid'),
      weeklyError: byTestId(weekly(page.host), 'load-error'),
      week: byTestId(page.host, 'admin-week-template') !== null,
      closures: closurePeriods(page.host),
    }).toEqual({
      crash: null,
      present: true,
      role: 'alert',
      retry: true,
      grid: null,
      weeklyError: null,
      week: true,
      closures: [ARMISTICE_PERIOD, CHRISTMAS_PERIOD],
    });
  });

  it('Given the month failed to load When Réessayer is pressed Then it is read again and the grid shows', async () => {
    const getAvailabilityCalendar = vi
      .fn<BookingGateway['getAvailabilityCalendar']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(NOVEMBER));
    const page = await openPage(spies({ getAvailabilityCalendar }));

    await press(page, calendar(page.host), 'load-error-retry');

    expect({
      calls: getAvailabilityCalendar.mock.calls,
      month: monthLabel(page.host),
      days: calendarDays(page.host).length,
      error: byTestId(calendar(page.host), 'load-error'),
    }).toEqual({ calls: [[null], [null]], month: 'Novembre 2026', days: 30, error: null });
  });
});

const calendarStatus = (host: HTMLElement): HTMLElement | null =>
  byTestId(calendar(host), 'admin-calendar-status');

const holidaysToggle = (host: HTMLElement): HTMLButtonElement | null =>
  nativeButton(byTestId(calendar(host), 'admin-calendar-holidays-toggle'));

const iconsOf = (element: Element | null): readonly string[] =>
  [...(element?.querySelectorAll('use') ?? [])].map(
    (use) => use.getAttribute('href')?.split('#')[1] ?? '',
  );

const dayName = (host: HTMLElement, date: string): string => {
  const day = calendarDayOn(host, date);
  return day ? accessibleName(day, host) : '';
};

async function clickDay(page: Page, date: string): Promise<void> {
  nativeButton(calendarDayOn(page.host, date))?.click();
  await settleBounded(page.fixture);
}

async function pressHolidaysToggle(page: Page): Promise<void> {
  holidaysToggle(page.host)?.click();
  await settleBounded(page.fixture);
}

const withDayOpen = (write: BookingGateway['setDayOpen']): Spies =>
  spies({ setDayOpen: vi.fn<BookingGateway['setDayOpen']>(write) });

const withBookings = (read: BookingGateway['getBookings']): Spies =>
  spies({ getBookings: vi.fn<BookingGateway['getBookings']>(read) });

function holidaysServer(write?: BookingGateway['setClosePublicHolidays']): Spies {
  let closed = true;
  const accept: BookingGateway['setClosePublicHolidays'] = (value) =>
    defer(() => {
      closed = value;
      return of({ success: true, data: value } as const);
    });
  const november = (): CalendarMonth =>
    aCalendarMonthOf('2026-11', {
      today: '2026-11-10',
      previousMonth: null,
      nextMonth: '2026-12',
      closePublicHolidays: closed,
      days: { '2026-11-11': { state: closed ? 'holiday' : 'open', holiday: 'Armistice 1918' } },
    });
  return spies({
    getAvailabilityCalendar: vi.fn<BookingGateway['getAvailabilityCalendar']>((month) =>
      defer(() => of(month === null || month === '2026-11' ? november() : calendarMonth(month))),
    ),
    setClosePublicHolidays: vi.fn<BookingGateway['setClosePublicHolidays']>(write ?? accept),
  });
}

const BOOKING_ON_12TH: AdminBooking = anAdminBooking({
  id: 'b-12',
  startsAt: '2026-11-12T17:00:00.000Z',
});
const BOOKING_AFTER_MIDNIGHT: AdminBooking = anAdminBooking({
  id: 'b-12-early',
  startsAt: '2026-11-11T23:30:00.000Z',
});

describe('AdminAvailability: fermer ou rouvrir un jour', () => {
  it('Given the calendar When it renders Then an empty status region waits in the calendar section', async () => {
    const page = await openPage();
    const status = calendarStatus(page.host);

    expect({
      present: status !== null,
      role: status?.getAttribute('role'),
      text: collapsed(status),
    }).toEqual({ present: true, role: 'status', text: '' });
  });

  it('Given the open 12 November When it is clicked Then one write closes it, the cell shows the answer, the closing is announced, the month is not read again and no toast is shown', async () => {
    const page = await openPage();

    await clickDay(page, '2026-11-12');

    expect({
      writes: page.setDayOpen.mock.calls,
      state: calendarDayOn(page.host, '2026-11-12')?.getAttribute('data-state'),
      name: dayName(page.host, '2026-11-12'),
      status: collapsed(calendarStatus(page.host)),
      reads: page.getAvailabilityCalendar.mock.calls.length,
      toasts: toasts(page),
    }).toEqual({
      writes: [['2026-11-12', false]],
      state: 'closed',
      name: 'jeudi 12 novembre 2026, fermé',
      status: 'Fermé : jeudi 12 novembre 2026.',
      reads: 1,
      toasts: [],
    });
  });

  it('Given the closed Armistice holiday When it is clicked Then one write reopens it and the reopened holiday is announced with its slots', async () => {
    const page = await openPage();

    await clickDay(page, '2026-11-11');

    expect({
      writes: page.setDayOpen.mock.calls,
      state: calendarDayOn(page.host, '2026-11-11')?.getAttribute('data-state'),
      name: dayName(page.host, '2026-11-11'),
      status: collapsed(calendarStatus(page.host)),
    }).toEqual({
      writes: [['2026-11-11', true]],
      state: 'open',
      name: 'mercredi 11 novembre 2026, férié (Armistice 1918) rouvert, 4 créneaux',
      status: 'Rouvert : mercredi 11 novembre 2026, 4 créneaux.',
    });
  });

  it('Given a write in flight on the 12th When it is clicked again Then a single write is sent, only the 12th is marked pending without any ARIA change, until the answer replaces it', async () => {
    const answer = new Subject<BookingAdminResult<CalendarDay>>();
    const page = await openPage(withDayOpen(() => answer));

    await clickDay(page, '2026-11-12');
    await clickDay(page, '2026-11-12');
    const day = (): HTMLElement | null => calendarDayOn(page.host, '2026-11-12');
    const meanwhile = {
      writes: page.setDayOpen.mock.calls.length,
      pending: calendarDays(page.host)
        .filter((cell) => cell.getAttribute('data-pending') === 'true')
        .map((cell) => accessibleName(cell, page.host)),
      disabled: day()?.getAttribute('aria-disabled') ?? null,
      busy: day()?.getAttribute('aria-busy') ?? null,
      state: day()?.getAttribute('data-state'),
    };
    answer.next({ success: true, data: aCalendarDay({ date: '2026-11-12', state: 'closed' }) });
    answer.complete();
    await settleBounded(page.fixture);

    expect({
      meanwhile,
      after: {
        pending: day()?.getAttribute('data-pending') ?? null,
        state: day()?.getAttribute('data-state'),
      },
    }).toEqual({
      meanwhile: {
        writes: 1,
        pending: ['jeudi 12 novembre 2026, ouvert, 4 créneaux'],
        disabled: null,
        busy: null,
        state: 'open',
      },
      after: { pending: null, state: 'closed' },
    });
  });

  it('Given the 12th focused When it is clicked Then after the answer the focus and the tab stop stay on it', async () => {
    const page = await openPage();

    calendarDayOn(page.host, '2026-11-12')?.focus();
    await settleBounded(page.fixture);
    await clickDay(page, '2026-11-12');

    expect({
      focused: focusedDay(page.host),
      stops: calendarTabStops(page.host),
    }).toEqual({
      focused: 'jeudi 12 novembre 2026, fermé',
      stops: ['jeudi 12 novembre 2026, fermé'],
    });
  });

  it('Given December reached by PageDown on the 12th and the focus moved to the 13th When the 13th is clicked Then the focus and the tab stop stay on the 13th, not back on the 12th', async () => {
    const page = await openPage();

    await pressKeyOn(page, '2026-11-12', 'PageDown');
    await pressKeyOn(page, '2026-12-12', 'ArrowRight');
    await clickDay(page, '2026-12-13');

    expect({
      writes: page.setDayOpen.mock.calls,
      focused: focusedDay(page.host),
      stops: calendarTabStops(page.host),
    }).toEqual({
      writes: [['2026-12-13', false]],
      focused: 'dimanche 13 décembre 2026, fermé',
      stops: ['dimanche 13 décembre 2026, fermé'],
    });
  });

  it('Given a past day and a day under a closure When they are clicked Then nothing is written and nothing is announced', async () => {
    const page = await openPage(
      withCalendar(() =>
        of(
          aCalendarMonthOf('2026-11', {
            today: '2026-11-10',
            nextMonth: '2026-12',
            days: {
              '2026-11-24': {
                state: 'closed-period',
                closure: { startsOn: '2026-11-24', endsOn: '2026-11-25', reason: 'Congés' },
              },
            },
          }),
        ),
      ),
    );

    await clickDay(page, '2026-11-09');
    await clickDay(page, '2026-11-24');

    expect({
      writes: page.setDayOpen.mock.calls,
      status: collapsed(calendarStatus(page.host)),
      present: calendarStatus(page.host) !== null,
    }).toEqual({ writes: [], status: '', present: true });
  });

  it('Given the 12th focused When Enter is pressed Then no write is sent by the key itself, the activation being the native click', async () => {
    const page = await openPage();

    await pressKeyOn(page, '2026-11-12', 'Enter');

    expect(page.setDayOpen.mock.calls).toEqual([]);
  });

  it.each<{ reason: BookingAdminFailure; detail: string; reads: number }>([
    { reason: 'day-past', detail: 'Ce jour est passé : il ne peut plus être modifié.', reads: 2 },
    {
      reason: 'day-in-closure',
      detail: 'Ce jour est couvert par une fermeture : modifiez-la dans la section Fermetures.',
      reads: 2,
    },
    {
      reason: 'network',
      detail: 'Modification impossible : vérifiez votre connexion, puis réessayez.',
      reads: 1,
    },
  ])(
    'Given the API answers $reason When the 12th is clicked Then « $detail » is told, the cell keeps its state and the month is read $reads time(s)',
    async ({ reason, detail, reads }) => {
      const page = await openPage(
        withDayOpen(() => defer(() => of({ success: false, reason } as const))),
      );

      await clickDay(page, '2026-11-12');

      expect({
        toasts: toasts(page),
        state: calendarDayOn(page.host, '2026-11-12')?.getAttribute('data-state'),
        reads: page.getAvailabilityCalendar.mock.calls.length,
        status: collapsed(calendarStatus(page.host)),
      }).toEqual({
        toasts: [{ severity: 'error', detail }],
        state: 'open',
        reads,
        status: '',
      });
    },
  );
});

describe('AdminAvailability: interrupteur des jours fériés', () => {
  it('Given holidays closed When the calendar renders Then a native toggle button named « Fermer les jours fériés » is pressed and checked', async () => {
    const page = await openPage();
    const toggle = holidaysToggle(page.host);

    expect({
      type: toggle?.getAttribute('type'),
      name: toggle ? accessibleName(toggle, page.host) : null,
      pressed: toggle?.getAttribute('aria-pressed'),
      role: toggle?.getAttribute('role') ?? null,
      icons: iconsOf(toggle),
    }).toEqual({
      type: 'button',
      name: 'Fermer les jours fériés',
      pressed: 'true',
      role: null,
      icons: ['solid-check'],
    });
  });

  it('Given holidays open When the calendar renders Then the toggle is not pressed and shows no check', async () => {
    const page = await openPage(
      withCalendar(() => of(aCalendarMonthOf('2026-11', { closePublicHolidays: false }))),
    );
    const toggle = holidaysToggle(page.host);

    expect({
      name: toggle ? accessibleName(toggle, page.host) : null,
      pressed: toggle?.getAttribute('aria-pressed'),
      icons: iconsOf(toggle),
    }).toEqual({ name: 'Fermer les jours fériés', pressed: 'false', icons: [] });
  });

  it('Given holidays closed When the toggle is pressed Then the setting is written once, the month is read again, the holiday opens, the label stays and the change is announced', async () => {
    const page = await openPage(holidaysServer());

    await pressHolidaysToggle(page);
    const toggle = holidaysToggle(page.host);

    expect({
      writes: page.setClosePublicHolidays.mock.calls,
      reads: page.getAvailabilityCalendar.mock.calls,
      pressed: toggle?.getAttribute('aria-pressed'),
      name: toggle ? accessibleName(toggle, page.host) : null,
      holiday: dayName(page.host, '2026-11-11'),
      status: collapsed(calendarStatus(page.host)),
      toasts: toasts(page),
    }).toEqual({
      writes: [[false]],
      reads: [[null], [null]],
      pressed: 'false',
      name: 'Fermer les jours fériés',
      holiday: 'mercredi 11 novembre 2026, férié (Armistice 1918) rouvert, 4 créneaux',
      status: 'Jours fériés ouverts selon la semaine type.',
      toasts: [],
    });
  });

  it('Given holidays opened by the toggle When it is pressed again Then they are closed again and announced so', async () => {
    const page = await openPage(holidaysServer());

    await pressHolidaysToggle(page);
    await pressHolidaysToggle(page);

    expect({
      writes: page.setClosePublicHolidays.mock.calls,
      pressed: holidaysToggle(page.host)?.getAttribute('aria-pressed'),
      status: collapsed(calendarStatus(page.host)),
    }).toEqual({
      writes: [[false], [true]],
      pressed: 'true',
      status: 'Jours fériés fermés.',
    });
  });

  it('Given the setting being written When the toggle is pressed again Then it is unavailable, nothing more is written, and it is available again after the answer', async () => {
    const answer = new Subject<BookingAdminResult<boolean>>();
    const page = await openPage(holidaysServer(() => answer));

    await pressHolidaysToggle(page);
    await pressHolidaysToggle(page);
    const meanwhile = {
      writes: page.setClosePublicHolidays.mock.calls.length,
      unavailable: holidaysToggle(page.host)?.getAttribute('aria-disabled'),
    };
    answer.next({ success: true, data: false });
    answer.complete();
    await settleBounded(page.fixture);

    expect({
      meanwhile,
      unavailable: holidaysToggle(page.host)?.getAttribute('aria-disabled') ?? null,
    }).toEqual({ meanwhile: { writes: 1, unavailable: 'true' }, unavailable: null });
  });

  it('Given the API cannot be reached When the toggle is pressed Then the error is told, the toggle keeps the server setting and the month is not read again', async () => {
    const page = await openPage(
      holidaysServer(() => defer(() => of({ success: false, reason: 'network' } as const))),
    );

    await pressHolidaysToggle(page);

    expect({
      toasts: toasts(page),
      pressed: holidaysToggle(page.host)?.getAttribute('aria-pressed'),
      reads: page.getAvailabilityCalendar.mock.calls.length,
      status: collapsed(calendarStatus(page.host)),
    }).toEqual({
      toasts: [
        {
          severity: 'error',
          detail: 'Réglage des jours fériés impossible : vérifiez votre connexion, puis réessayez.',
        },
      ],
      pressed: 'true',
      reads: 1,
      status: '',
    });
  });
});

describe('AdminAvailability: rendez-vous sur un jour fermé', () => {
  const warningOf = (host: HTMLElement): HTMLElement | null =>
    byTestId(calendar(host), 'admin-calendar-booking-warning');

  it('Given one confirmed booking on the 12th When the 12th is closed Then it is closed anyway and the status warns, with a link to the bookings', async () => {
    const page = await openPage(withBookings(() => of([BOOKING_ON_12TH])));

    await clickDay(page, '2026-11-12');
    const warning = warningOf(page.host);
    const link = warning && byTestId(warning, 'admin-calendar-booking-warning-link');

    expect({
      reads: page.getBookings.mock.calls,
      state: calendarDayOn(page.host, '2026-11-12')?.getAttribute('data-state'),
      warning: collapsed(warning),
      announced: warning !== null && calendarStatus(page.host)?.contains(warning) === true,
      link: link?.tagName,
      href: link?.getAttribute('href'),
      linkName: link ? accessibleName(link, page.host) : null,
    }).toEqual({
      reads: [['upcoming']],
      state: 'closed',
      warning:
        '1 rendez-vous reste prévu le jeudi 12 novembre 2026 : annulez-le depuis Rendez-vous si besoin.',
      announced: true,
      link: 'A',
      href: '/admin/rendez-vous',
      linkName: 'Rendez-vous',
    });
  });

  it('Given two confirmed bookings on the 12th in Paris time When the 12th is closed Then the warning is in the plural', async () => {
    const page = await openPage(withBookings(() => of([BOOKING_ON_12TH, BOOKING_AFTER_MIDNIGHT])));

    await clickDay(page, '2026-11-12');

    expect(collapsed(warningOf(page.host))).toBe(
      '2 rendez-vous restent prévus le jeudi 12 novembre 2026 : annulez-les depuis Rendez-vous si besoin.',
    );
  });

  it('Given a booking on the 12th only When the 16th is closed Then no warning is shown', async () => {
    const page = await openPage(withBookings(() => of([BOOKING_ON_12TH])));

    await clickDay(page, '2026-11-16');

    expect({
      state: calendarDayOn(page.host, '2026-11-16')?.getAttribute('data-state'),
      warning: warningOf(page.host),
    }).toEqual({ state: 'closed', warning: null });
  });

  it('Given the bookings never answer When the page opens Then the calendar shows its month', async () => {
    const page = await openPage(withBookings(() => NEVER));

    expect({
      crash: page.crash,
      month: monthLabel(page.host),
      days: calendarDays(page.host).length,
      reads: page.getBookings.mock.calls,
    }).toEqual({ crash: null, month: 'Novembre 2026', days: 30, reads: [['upcoming']] });
  });

  it('Given the bookings cannot be read When the 12th is closed Then it is closed without warning nor toast', async () => {
    const page = await openPage(withBookings(() => throwError(() => new Error('down'))));

    await clickDay(page, '2026-11-12');

    expect({
      crash: page.crash,
      state: calendarDayOn(page.host, '2026-11-12')?.getAttribute('data-state'),
      warning: warningOf(page.host),
      toasts: toasts(page),
    }).toEqual({ crash: null, state: 'closed', warning: null, toasts: [] });
  });
});

describe('AdminAvailability: rechargement du calendrier', () => {
  it('Given the calendar When a closure is added Then the month is read again', async () => {
    const page = await openPage();

    await fillClosure(page, { startsOn: '2026-12-01', endsOn: '2026-12-02' });
    await submitClosure(page);

    expect(page.getAvailabilityCalendar.mock.calls).toEqual([[null], [null]]);
  });

  it('Given the calendar When a closure is deleted Then the month is read again', async () => {
    const page = await openPage();

    await askDeletion(page, CHRISTMAS_PERIOD);
    await answer(page, dialogTitled(page.host, DELETE_HEADING), 'confirm');

    expect(page.getAvailabilityCalendar.mock.calls).toEqual([[null], [null]]);
  });

  it('Given December shown When a closure is added Then December is read again by name', async () => {
    const page = await openPage();

    await press(page, calendar(page.host), 'admin-calendar-next');
    await fillClosure(page, { startsOn: '2026-12-01', endsOn: '2026-12-02' });
    await submitClosure(page);

    expect(page.getAvailabilityCalendar.mock.calls).toEqual([[null], ['2026-12'], ['2026-12']]);
  });

  it('Given an added closure refused When the API answers an error Then the month is not read again', async () => {
    const page = await openPage(
      spies({
        createClosure: vi.fn<BookingGateway['createClosure']>(() =>
          defer(() => of({ success: false, reason: 'invalid' } as const)),
        ),
      }),
    );

    await fillClosure(page, { startsOn: '2026-12-01', endsOn: '2026-12-02' });
    await submitClosure(page);

    expect(page.getAvailabilityCalendar.mock.calls).toEqual([[null]]);
  });

  it('Given the week edited When it is saved Then the month is read again for its slot counts', async () => {
    const page = await openPage();

    await toggleSlots(page, 'Mardi', '18:00');
    await save(page);

    expect(page.getAvailabilityCalendar.mock.calls).toEqual([[null], [null]]);
  });
});
