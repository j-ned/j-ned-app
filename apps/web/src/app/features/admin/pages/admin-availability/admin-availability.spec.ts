import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, Observable, defer, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminFailure,
} from '@features/booking/domain/models/booking-admin.model';
import {
  anAvailabilityClosure,
  anAvailabilityRule,
} from '@features/booking/testing/booking-builders';
import { stubBookingGateway } from '@features/booking/testing/stub-booking-gateway';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { settleBounded } from '@shared/testing/settle';
import type { ToastMessage } from '@shared/ui/toast.types';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';
import { AdminAvailability } from './admin-availability';

@Component({ template: '' })
class BlankPage {}

const MONDAY_MORNING = anAvailabilityRule({ weekday: 1, startMinute: 540, endMinute: 720 });
const MONDAY_AFTERNOON = anAvailabilityRule({ weekday: 1, startMinute: 840, endMinute: 1080 });
const WEDNESDAY = anAvailabilityRule({ weekday: 3, startMinute: 600, endMinute: 690 });
const RULES: readonly AvailabilityRule[] = [MONDAY_MORNING, MONDAY_AFTERNOON, WEDNESDAY];

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

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
type DayLabel = (typeof DAYS)[number];

const HALF_HOURS = Array.from(
  { length: 49 },
  (_, index) =>
    `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`,
);
const START_OPTIONS = ['', ...HALF_HOURS.slice(0, 48)];
const END_OPTIONS = ['', ...HALF_HOURS.slice(1)];

type Spies = {
  readonly getAvailabilityRules: Mock<BookingGateway['getAvailabilityRules']>;
  readonly replaceAvailabilityRules: Mock<BookingGateway['replaceAvailabilityRules']>;
  readonly getClosures: Mock<BookingGateway['getClosures']>;
  readonly createClosure: Mock<BookingGateway['createClosure']>;
  readonly deleteClosure: Mock<BookingGateway['deleteClosure']>;
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
    ...overrides,
  };
}

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

const allByTestId = (root: ParentNode, testId: string): readonly HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const weekly = (host: HTMLElement): HTMLElement =>
  byTestId(host, 'admin-availability-weekly') ?? host;

const closures = (host: HTMLElement): HTMLElement => byTestId(host, 'admin-closures') ?? host;

const legendOf = (fieldset: Element): string =>
  normalized([...fieldset.children].find((child) => child.tagName === 'LEGEND'));

const dayFieldsets = (host: HTMLElement): readonly HTMLElement[] =>
  allByTestId(host, 'admin-availability-day');

const day = (host: HTMLElement, label: DayLabel): HTMLElement | null =>
  dayFieldsets(host).find((fieldset) => legendOf(fieldset) === label) ?? null;

const timeSelect = (
  root: ParentNode | null,
  part: 'start' | 'end',
  index: number,
): HTMLSelectElement | null => {
  const element = root && byTestId(root, `admin-availability-rule-${part}`, index);
  return element instanceof HTMLSelectElement ? element : null;
};

const rangesOf = (
  host: HTMLElement,
  label: DayLabel,
): readonly { readonly start: string; readonly end: string }[] => {
  const fieldset = day(host, label);
  return fieldset === null
    ? []
    : allByTestId(fieldset, 'admin-availability-rule').map((row) => ({
        start: timeSelect(row, 'start', 0)?.value ?? '',
        end: timeSelect(row, 'end', 0)?.value ?? '',
      }));
};

const labelOf = (host: HTMLElement, control: Element | null): string => {
  if (control === null || control.id === '') return '';
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => label.getAttribute('for') === control.id,
  );
  return labels.length === 1 ? normalized(labels[0]) : '';
};

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
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

async function choose(
  page: Page,
  label: DayLabel,
  index: number,
  part: 'start' | 'end',
  value: string,
): Promise<void> {
  const select = timeSelect(day(page.host, label), part, index);
  if (select === null) return;
  select.value = value;
  select.dispatchEvent(new Event('input'));
  select.dispatchEvent(new Event('change'));
  select.dispatchEvent(new Event('blur'));
  await settleBounded(page.fixture);
}

async function addRange(page: Page, label: DayLabel): Promise<void> {
  await press(page, day(page.host, label), 'admin-availability-rule-add');
}

async function removeRange(page: Page, label: DayLabel, index: number): Promise<void> {
  await press(page, day(page.host, label), 'admin-availability-rule-remove', index);
}

const rowError = (
  host: HTMLElement,
  label: DayLabel,
  index: number,
  part: 'start' | 'end',
): string | null => {
  const row = allByTestId(day(host, label) ?? host, 'admin-availability-rule')[index];
  const error = row && byTestId(row, `admin-availability-rule-${part}-error`);
  return error ? normalized(error) : null;
};

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
  it('Given rules and closures When /admin/disponibilites is opened Then both are read once, the page is titled « Disponibilités » with its two sections and nothing is left to save', async () => {
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
      sections: ['Plages hebdomadaires', 'Fermetures'],
      state: 'Aucune modification',
    });
  });

  it('Given the page When the header renders Then the introduction says how the offered slots are derived', async () => {
    const page = await openPage();

    expect(normalized(byTestId(page.host, 'admin-page-title')?.nextElementSibling)).toBe(
      "Les créneaux de 30 minutes proposés sur la page de réservation découlent de ces plages, à l'heure de Paris, moins les fermetures et les rendez-vous déjà pris.",
    );
  });

  it('Given the rules When the weekly grid renders Then it is the availability form with one fieldset per day, Monday to Sunday', async () => {
    const page = await openPage();
    const form = byTestId(page.host, 'admin-availability-rules');

    expect({
      tag: form?.tagName,
      id: form?.id,
      fieldsets: dayFieldsets(page.host).map((fieldset) => ({
        tag: fieldset.tagName,
        legend: legendOf(fieldset),
        inForm: form?.contains(fieldset) ?? false,
      })),
    }).toEqual({
      tag: 'FORM',
      id: 'availability-form',
      fieldsets: DAYS.map((legend) => ({ tag: 'FIELDSET', legend, inForm: true })),
    });
  });

  it('Given two Monday ranges and one on Wednesday When the grid renders Then each day shows its ranges and the others say they offer no slot', async () => {
    const page = await openPage();

    expect({
      ranges: Object.fromEntries(DAYS.map((label) => [label, rangesOf(page.host, label)])),
      empty: DAYS.filter((label) => {
        const fieldset = day(page.host, label);
        return fieldset !== null && byTestId(fieldset, 'admin-availability-day-empty') !== null;
      }),
      emptyText: testIdText(day(page.host, 'Mardi') ?? page.host, 'admin-availability-day-empty'),
      none: byTestId(page.host, 'admin-availability-none'),
    }).toEqual({
      ranges: {
        Lundi: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '18:00' },
        ],
        Mardi: [],
        Mercredi: [{ start: '10:00', end: '11:30' }],
        Jeudi: [],
        Vendredi: [],
        Samedi: [],
        Dimanche: [],
      },
      empty: ['Mardi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      emptyText: 'Aucun créneau ce jour-là',
      none: null,
    });
  });

  it('Given a whole Sunday When the grid renders Then its range reads from 00:00 to 24:00', async () => {
    const page = await openPage(
      spies({
        getAvailabilityRules: vi.fn<BookingGateway['getAvailabilityRules']>(() =>
          of([anAvailabilityRule({ weekday: 7, startMinute: 0, endMinute: 1440 })]),
        ),
      }),
    );

    expect(rangesOf(page.host, 'Dimanche')).toEqual([{ start: '00:00', end: '24:00' }]);
  });

  it('Given no rule at all When the grid renders Then a notice says the booking page offers no slot, and every day is still editable', async () => {
    const page = await openPage(
      spies({ getAvailabilityRules: vi.fn<BookingGateway['getAvailabilityRules']>(() => of([])) }),
    );

    expect({
      none: testIdText(page.host, 'admin-availability-none'),
      days: dayFieldsets(page.host).length,
      add: allByTestId(page.host, 'admin-availability-rule-add').length,
    }).toEqual({
      none: "Aucune plage\u00a0: la page de réservation n'affiche aucun créneau.",
      days: 7,
      add: 7,
    });
  });
});

describe('AdminAvailability: libellés et choix des heures', () => {
  it('Given the Monday ranges When they render Then each time selector is named after its range and its day, with its own id', async () => {
    const page = await openPage();
    const monday = day(page.host, 'Lundi');
    const controls = [
      timeSelect(monday, 'start', 0),
      timeSelect(monday, 'end', 0),
      timeSelect(monday, 'start', 1),
      timeSelect(monday, 'end', 1),
    ];
    const ids = [...page.host.querySelectorAll('select')].map((select) => select.id);

    expect({
      labels: controls.map((control) => labelOf(page.host, control)),
      uniqueIds: ids.length > 0 && new Set(ids).size === ids.length && !ids.includes(''),
    }).toEqual({
      labels: [
        'Début de la plage 1 du lundi',
        'Fin de la plage 1 du lundi',
        'Début de la plage 2 du lundi',
        'Fin de la plage 2 du lundi',
      ],
      uniqueIds: true,
    });
  });

  it('Given a range When its selectors render Then the start offers every half hour from 00:00 to 23:30 and the end from 00:30 to 24:00', async () => {
    const page = await openPage();
    const monday = day(page.host, 'Lundi');

    expect({
      start: [...(timeSelect(monday, 'start', 0)?.options ?? [])].map((option) => option.value),
      end: [...(timeSelect(monday, 'end', 0)?.options ?? [])].map((option) => option.value),
    }).toEqual({ start: START_OPTIONS, end: END_OPTIONS });
  });

  it('Given the grid When it renders Then each range has a remove button naming it, and each day an add button naming the day', async () => {
    const page = await openPage();
    const removeButtons = allByTestId(
      day(page.host, 'Lundi') ?? page.host,
      'admin-availability-rule-remove',
    );
    const addButtons = allByTestId(page.host, 'admin-availability-rule-add');

    expect({
      remove: removeButtons.map((button) => ({
        type: nativeButton(button)?.type,
        name: accessibleName(nativeButton(button) ?? button, page.host),
      })),
      add: addButtons.map((button) => ({
        type: nativeButton(button)?.type,
        name: accessibleName(nativeButton(button) ?? button, page.host),
      })),
    }).toEqual({
      remove: [
        { type: 'button', name: 'Retirer la plage 1 du lundi' },
        { type: 'button', name: 'Retirer la plage 2 du lundi' },
      ],
      add: DAYS.map((label) => ({
        type: 'button',
        name: `Ajouter une plage le ${label.toLowerCase()}`,
      })),
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

  it('Given the rules failed to load When Réessayer is pressed Then they are read again and the grid shows', async () => {
    const getAvailabilityRules = vi
      .fn<BookingGateway['getAvailabilityRules']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(RULES));
    const page = await openPage(spies({ getAvailabilityRules }));

    await press(page, weekly(page.host), 'load-error-retry');

    expect({
      calls: getAvailabilityRules.mock.calls.length,
      monday: rangesOf(page.host, 'Lundi'),
    }).toEqual({
      calls: 2,
      monday: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
    });
  });
});

describe('AdminAvailability: modifier les plages', () => {
  it('Given an empty Tuesday When a range is added Then an unfilled range appears there and one change is reported', async () => {
    const page = await openPage();

    await addRange(page, 'Mardi');

    expect({
      tuesday: rangesOf(page.host, 'Mardi'),
      empty: byTestId(day(page.host, 'Mardi') ?? page.host, 'admin-availability-day-empty'),
      label: labelOf(page.host, timeSelect(day(page.host, 'Mardi'), 'start', 0)),
      state: saveBarState(page),
    }).toEqual({
      tuesday: [{ start: '', end: '' }],
      empty: null,
      label: 'Début de la plage 1 du mardi',
      state: '1 modification non enregistrée',
    });
  });

  it('Given two Monday ranges When the first is removed Then the afternoon becomes range 1 and one change is reported', async () => {
    const page = await openPage();

    await removeRange(page, 'Lundi', 0);
    const monday = day(page.host, 'Lundi');

    expect({
      monday: rangesOf(page.host, 'Lundi'),
      label: labelOf(page.host, timeSelect(monday, 'start', 0)),
      remove: allByTestId(monday ?? page.host, 'admin-availability-rule-remove').map((button) =>
        accessibleName(nativeButton(button) ?? button, page.host),
      ),
      state: saveBarState(page),
    }).toEqual({
      monday: [{ start: '14:00', end: '18:00' }],
      label: 'Début de la plage 1 du lundi',
      remove: ['Retirer la plage 1 du lundi'],
      state: '1 modification non enregistrée',
    });
  });

  it('Given the only Wednesday range When it is removed Then the day says it offers no slot', async () => {
    const page = await openPage();

    await removeRange(page, 'Mercredi', 0);

    expect(
      testIdText(day(page.host, 'Mercredi') ?? page.host, 'admin-availability-day-empty'),
    ).toBe('Aucun créneau ce jour-là');
  });

  it('Given Monday and Thursday edited When the bar renders Then it reports two changes', async () => {
    const page = await openPage();

    await choose(page, 'Lundi', 0, 'end', '12:30');
    await addRange(page, 'Jeudi');

    expect({ monday: rangesOf(page.host, 'Lundi')[0], state: saveBarState(page) }).toEqual({
      monday: { start: '09:00', end: '12:30' },
      state: '2 modifications non enregistrées',
    });
  });

  it('Given a range added on Tuesday When it is removed again Then nothing is left to save', async () => {
    const page = await openPage();

    await addRange(page, 'Mardi');
    await removeRange(page, 'Mardi', 0);

    expect(saveBarState(page)).toBe('Aucune modification');
  });
});

describe('AdminAvailability: validation des plages', () => {
  it.each([
    { case: 'equal to', end: '09:00' },
    { case: 'before', end: '08:30' },
  ])(
    'Given the first Monday range When its end is set $case its start Then the end announces that it must follow the start and is described by it',
    async ({ end }) => {
      const page = await openPage();

      await choose(page, 'Lundi', 0, 'end', end);
      const control = timeSelect(day(page.host, 'Lundi'), 'end', 0);
      const row = allByTestId(day(page.host, 'Lundi') ?? page.host, 'admin-availability-rule')[0];
      const error = row ? byTestId(row, 'admin-availability-rule-end-error') : null;

      expect({
        message: normalized(error),
        role: error?.getAttribute('role'),
        invalid: control?.getAttribute('aria-invalid'),
        describedBy:
          error !== null &&
          error.id !== '' &&
          control?.getAttribute('aria-describedby') === error.id,
        startError: rowError(page.host, 'Lundi', 0, 'start'),
      }).toEqual({
        message: 'La fin doit suivre le début',
        role: 'alert',
        invalid: 'true',
        describedBy: true,
        startError: null,
      });
    },
  );

  it('Given two Monday ranges When the second is made to start inside the first Then its start announces the overlap and the first range stays valid', async () => {
    const page = await openPage();

    await choose(page, 'Lundi', 1, 'start', '11:00');
    const control = timeSelect(day(page.host, 'Lundi'), 'start', 1);

    expect({
      second: rowError(page.host, 'Lundi', 1, 'start'),
      invalid: control?.getAttribute('aria-invalid'),
      first: [rowError(page.host, 'Lundi', 0, 'start'), rowError(page.host, 'Lundi', 0, 'end')],
    }).toEqual({ second: 'Chevauche la plage 1', invalid: 'true', first: [null, null] });
  });

  it('Given the first Monday range stretched over the second When « Enregistrer » is pressed Then nothing is sent and the later range announces the overlap', async () => {
    const page = await openPage();

    await choose(page, 'Lundi', 0, 'end', '15:00');
    await save(page);

    expect({
      calls: page.replaceAvailabilityRules.mock.calls.length,
      second: rowError(page.host, 'Lundi', 1, 'start'),
      toasts: toasts(page),
    }).toEqual({ calls: 0, second: 'Chevauche la plage 1', toasts: [] });
  });

  it('Given an added Tuesday range left unfilled When « Enregistrer » is pressed Then nothing is sent and both times ask to be chosen', async () => {
    const page = await openPage();

    await addRange(page, 'Mardi');
    await save(page);

    expect({
      calls: page.replaceAvailabilityRules.mock.calls.length,
      start: rowError(page.host, 'Mardi', 0, 'start'),
      end: rowError(page.host, 'Mardi', 0, 'end'),
    }).toEqual({
      calls: 0,
      start: "Choisissez l'heure de début",
      end: "Choisissez l'heure de fin",
    });
  });

  it('Given a Monday range touching the next one and the same hours on Tuesday When « Enregistrer » is pressed Then the grid is sent', async () => {
    const page = await openPage();

    await addRange(page, 'Lundi');
    await choose(page, 'Lundi', 2, 'start', '12:00');
    await choose(page, 'Lundi', 2, 'end', '14:00');
    await addRange(page, 'Mardi');
    await choose(page, 'Mardi', 0, 'start', '09:00');
    await choose(page, 'Mardi', 0, 'end', '12:00');
    await save(page);

    expect({
      errors: allByTestId(page.host, 'admin-availability-rule-start-error').length,
      calls: page.replaceAvailabilityRules.mock.calls.length,
    }).toEqual({ errors: 0, calls: 1 });
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

  it('Given a range added on Tuesday When it is saved Then the whole grid is sent once, success is told and nothing is left to save', async () => {
    const page = await openPage();

    await addRange(page, 'Mardi');
    await choose(page, 'Mardi', 0, 'start', '09:00');
    await choose(page, 'Mardi', 0, 'end', '10:00');
    await save(page);

    expect({
      calls: page.replaceAvailabilityRules.mock.calls,
      toasts: toasts(page),
      state: saveBarState(page),
    }).toEqual({
      calls: [
        [
          [
            { weekday: 1, startMinute: 540, endMinute: 720 },
            { weekday: 1, startMinute: 840, endMinute: 1080 },
            { weekday: 2, startMinute: 540, endMinute: 600 },
            { weekday: 3, startMinute: 600, endMinute: 690 },
          ],
        ],
      ],
      toasts: [{ severity: 'success', detail: 'Disponibilités enregistrées' }],
      state: 'Aucune modification',
    });
  });

  it('Given an early range added last on Monday When the API answers the sorted grid Then the day shows the returned order with nothing left to save', async () => {
    const page = await openPage(
      spies({
        replaceAvailabilityRules: vi.fn<BookingGateway['replaceAvailabilityRules']>(() =>
          of({
            success: true,
            data: [
              anAvailabilityRule({ weekday: 1, startMinute: 420, endMinute: 480 }),
              MONDAY_MORNING,
              MONDAY_AFTERNOON,
              WEDNESDAY,
            ],
          } as const),
        ),
      }),
    );

    await addRange(page, 'Lundi');
    await choose(page, 'Lundi', 2, 'start', '07:00');
    await choose(page, 'Lundi', 2, 'end', '08:00');
    await save(page);

    expect({
      sent: page.replaceAvailabilityRules.mock.calls[0]?.[0],
      monday: rangesOf(page.host, 'Lundi'),
      state: saveBarState(page),
    }).toEqual({
      sent: [
        { weekday: 1, startMinute: 540, endMinute: 720 },
        { weekday: 1, startMinute: 840, endMinute: 1080 },
        { weekday: 1, startMinute: 420, endMinute: 480 },
        { weekday: 3, startMinute: 600, endMinute: 690 },
      ],
      monday: [
        { start: '07:00', end: '08:00' },
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
      state: 'Aucune modification',
    });
  });

  it('Given every range removed When it is saved Then an empty grid is sent', async () => {
    const page = await openPage();

    await removeRange(page, 'Lundi', 1);
    await removeRange(page, 'Lundi', 0);
    await removeRange(page, 'Mercredi', 0);
    await save(page);

    expect(page.replaceAvailabilityRules.mock.calls).toEqual([[[]]]);
  });

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    {
      reason: 'overlap',
      detail: 'Deux plages du même jour se chevauchent : corrigez-les, puis enregistrez.',
    },
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
    'Given the API answers $reason When the grid is saved Then « $detail » is told and the draft is kept',
    async ({ reason, detail }) => {
      const page = await openPage(
        spies({
          replaceAvailabilityRules: vi.fn<BookingGateway['replaceAvailabilityRules']>(() =>
            of({ success: false, reason }),
          ),
        }),
      );

      await choose(page, 'Lundi', 0, 'end', '12:30');
      await save(page);

      expect({
        toasts: toasts(page),
        monday: rangesOf(page.host, 'Lundi')[0],
        state: saveBarState(page),
        disabled: nativeButton(byTestId(page.host, 'savebar-submit'))?.disabled,
      }).toEqual({
        toasts: [{ severity: 'error', detail }],
        monday: { start: '09:00', end: '12:30' },
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

    await choose(page, 'Lundi', 0, 'end', '12:30');
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

    await addRange(page, 'Mardi');
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
    { reply: 'confirm', url: '/admin', tuesday: [] },
    { reply: 'cancel', url: '/admin/disponibilites', tuesday: [{ start: '', end: '' }] },
  ] as const)(
    'Given the leave dialog When the admin answers $reply Then the address is $url',
    async ({ reply, url, tuesday }) => {
      const page = await openPage();

      await addRange(page, 'Mardi');
      await leaveByCancel(page);
      await answer(page, dialogTitled(page.host, LEAVE_HEADING), reply);

      expect({
        url: TestBed.inject(Router).url,
        open: dialogTitled(page.host, LEAVE_HEADING)?.open ?? false,
        tuesday: rangesOf(page.host, 'Mardi'),
      }).toEqual({ url, open: false, tuesday });
    },
  );

  it('Given an edited grid saved When the admin leaves Then no dialog is asked', async () => {
    const page = await openPage();

    await choose(page, 'Lundi', 0, 'end', '12:30');
    await save(page);
    await leaveByCancel(page);

    expect({
      saved: page.replaceAvailabilityRules.mock.calls.length,
      url: TestBed.inject(Router).url,
    }).toEqual({ saved: 1, url: '/admin' });
  });

  it('Given the tab about to close When the grid is untouched then edited Then the browser warning is requested only once edited', async () => {
    const page = await openPage();
    const untouched = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(untouched);

    await addRange(page, 'Mardi');
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
