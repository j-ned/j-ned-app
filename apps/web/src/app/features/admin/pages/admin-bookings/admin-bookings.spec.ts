import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AdminBooking,
  BookingAdminFailure,
  BookingAdminResult,
  BookingScope,
} from '@features/booking/domain/models/booking-admin.model';
import { anAdminBooking } from '@features/booking/testing/booking-builders';
import { stubBookingGateway } from '@features/booking/testing/stub-booking-gateway';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import type { ToastMessage } from '@shared/ui/toast.types';
import {
  answerConfirmDialog,
  confirmDialogElement,
  readConfirmDialog,
} from '@shared/ui/testing/confirm-dialog-page';
import { AdminBookings } from './admin-bookings';

const NOW = new Date('2026-10-15T10:00:00.000Z');

const CAMILLE = anAdminBooking({
  id: 'b-camille',
  startsAt: '2026-10-19T07:00:00.000Z',
  endsAt: '2026-10-19T07:30:00.000Z',
  name: 'Camille Martin',
  email: 'camille@example.com',
  company: 'Atelier Martin',
  message: 'Refonte d’une application Angular.',
  format: 'video',
  videoUrl: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
});
const LEO = anAdminBooking({
  id: 'b-leo',
  startsAt: '2026-10-20T12:30:00.000Z',
  endsAt: '2026-10-20T13:00:00.000Z',
  name: 'Léo Petit',
  email: 'leo@example.com',
  company: null,
  message: 'Une application mobile de réservation.',
  format: 'phone',
  phone: '06 12 34 56 78',
  videoUrl: null,
});
const INES = anAdminBooking({
  id: 'b-ines',
  startsAt: '2026-10-21T08:00:00.000Z',
  endsAt: '2026-10-21T08:30:00.000Z',
  name: 'Inès Roux',
  email: 'ines@example.com',
  status: 'cancelled',
  cancelledAt: '2026-10-14T09:00:00.000Z',
  cancelledBy: 'visitor',
  cancelReason: 'Projet reporté.',
});
const NOE = anAdminBooking({
  id: 'b-noe',
  startsAt: '2026-10-01T08:00:00.000Z',
  endsAt: '2026-10-01T08:30:00.000Z',
  name: 'Noé Garnier',
  email: 'noe@example.com',
});
const STARTED = anAdminBooking({
  id: 'b-started',
  startsAt: '2026-10-15T09:50:00.000Z',
  endsAt: '2026-10-15T10:20:00.000Z',
  name: 'Sacha Blanc',
  email: 'sacha@example.com',
});

const LISTS: Record<BookingScope, readonly AdminBooking[]> = {
  upcoming: [CAMILLE, LEO, INES],
  past: [NOE],
};

type Toasts = { readonly add: Mock<(message: ToastMessage) => void> };

type Rendered = {
  readonly fixture: ComponentFixture<AdminBookings>;
  readonly host: HTMLElement;
  readonly toast: Toasts;
  readonly crash: unknown;
};

type Spies = {
  readonly getBookings: Mock<(scope: BookingScope) => Observable<readonly AdminBooking[]>>;
  readonly cancelBookingAsOwner: Mock<
    (id: string, reason: string | null) => Observable<BookingAdminResult<AdminBooking>>
  >;
  readonly invalidateUpcomingCount: Mock<() => void>;
};

function spies(
  options: {
    readonly lists?: Partial<Record<BookingScope, Observable<readonly AdminBooking[]>>>;
    readonly cancel?: (id: string, reason: string | null) => BookingAdminResult<AdminBooking>;
  } = {},
): Spies {
  return {
    getBookings: vi.fn(
      (scope: BookingScope): Observable<readonly AdminBooking[]> =>
        options.lists?.[scope] ?? of(LISTS[scope]),
    ),
    cancelBookingAsOwner: vi.fn(
      (id: string, reason: string | null): Observable<BookingAdminResult<AdminBooking>> =>
        of(
          options.cancel?.(id, reason) ?? {
            success: true,
            data: {
              ...(LISTS.upcoming.find((booking) => booking.id === id) ?? CAMILLE),
              status: 'cancelled',
              cancelledAt: NOW.toISOString(),
              cancelledBy: 'owner',
              cancelReason: reason,
            },
          },
        ),
    ),
    invalidateUpcomingCount: vi.fn<() => void>(),
  };
}

async function render(gateway: Spies = spies()): Promise<Rendered> {
  const toast: Toasts = { add: vi.fn<(message: ToastMessage) => void>() };
  TestBed.configureTestingModule({
    providers: [
      { provide: BookingGateway, useValue: stubBookingGateway(gateway) },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminBookings);
  const crash = await captureCrash(() => settleBounded(fixture));
  return { fixture, host: fixture.nativeElement as HTMLElement, toast, crash };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const allByTestId = (root: ParentNode, testId: string): readonly HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const rows = (host: HTMLElement): readonly HTMLElement[] => allByTestId(host, 'admin-booking-row');

const names = (host: HTMLElement): readonly string[] =>
  rows(host).map((row) => testIdText(row, 'admin-booking-name'));

const rowOf = (host: HTMLElement, name: string): HTMLElement | null =>
  rows(host).find((row) => testIdText(row, 'admin-booking-name') === name) ?? null;

const cancelButtonNames = (host: HTMLElement): readonly string[] =>
  allByTestId(host, 'admin-booking-cancel').map((button) => accessibleName(button, host));

const filterOption = (host: HTMLElement, label: string): HTMLElement | null =>
  allByTestId(host, 'filter-option').find(
    (option) => testIdText(option, 'filter-option-label') === label,
  ) ?? null;

async function pressFilter(rendered: Rendered, label: string): Promise<void> {
  filterOption(rendered.host, label)?.click();
  await settleBounded(rendered.fixture);
}

async function requestCancellation(rendered: Rendered, name: string): Promise<void> {
  rowOf(rendered.host, name)
    ?.querySelector<HTMLElement>('[data-testid="admin-booking-cancel"]')
    ?.click();
  await settleBounded(rendered.fixture);
}

const reasonField = (host: HTMLElement): HTMLTextAreaElement | null => {
  const field = byTestId(host, 'admin-booking-reason');
  return field instanceof HTMLTextAreaElement ? field : null;
};

const labelOf = (field: HTMLElement | null): string => {
  if (field === null) return '';
  const label =
    field.closest('label') ??
    (field.id === '' ? null : field.ownerDocument.querySelector(`label[for="${field.id}"]`));
  return normalized(label);
};

async function typeReason(rendered: Rendered, text: string): Promise<void> {
  const field = reasonField(rendered.host);
  if (field === null) return;
  field.value = text;
  field.dispatchEvent(new Event('input'));
  await settleBounded(rendered.fixture);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AdminBookings: liste', () => {
  it('Given three upcoming bookings When the page renders Then they are listed in the order of the API, one list item each', async () => {
    const { host, crash } = await render();
    const list = byTestId(host, 'admin-bookings-list');

    expect({
      crash,
      tag: list?.tagName,
      role: list?.getAttribute('role'),
      items: [...(list?.children ?? [])].map((item) => item.tagName),
      names: names(host),
    }).toEqual({
      crash: null,
      tag: 'UL',
      role: 'list',
      items: ['LI', 'LI', 'LI'],
      names: ['Camille Martin', 'Léo Petit', 'Inès Roux'],
    });
  });

  it('Given a confirmed video call When its row renders Then it shows the Paris time, the contact, the company, the need and a link to the call', async () => {
    const { host } = await render();
    const row = rowOf(host, 'Camille Martin');
    const when = row && byTestId(row, 'admin-booking-when');
    const email = row && byTestId(row, 'admin-booking-email');
    const video = row && byTestId(row, 'admin-booking-video');

    expect({
      when: {
        tag: when?.tagName,
        datetime: when?.getAttribute('datetime'),
        text: normalized(when),
      },
      email: { tag: email?.tagName, href: email?.getAttribute('href'), text: normalized(email) },
      company: normalized(row && byTestId(row, 'admin-booking-company')),
      format: normalized(row && byTestId(row, 'admin-booking-format')),
      video: {
        tag: video?.tagName,
        href: video?.getAttribute('href'),
        target: video?.getAttribute('target'),
        noopener: (video?.getAttribute('rel') ?? '').split(' ').includes('noopener'),
      },
      phone: row && byTestId(row, 'admin-booking-phone'),
      message: normalized(row && byTestId(row, 'admin-booking-message')),
      status: normalized(row && byTestId(row, 'admin-booking-status')),
      reason: row && byTestId(row, 'admin-booking-cancel-reason'),
    }).toEqual({
      when: {
        tag: 'TIME',
        datetime: '2026-10-19T07:00:00.000Z',
        text: 'lundi 19 octobre 2026 à 09:00',
      },
      email: { tag: 'A', href: 'mailto:camille@example.com', text: 'camille@example.com' },
      company: 'Atelier Martin',
      format: 'Visio',
      video: {
        tag: 'A',
        href: 'https://meet.jit.si/nedellec-a1b2c3d4e5f6g7h8',
        target: '_blank',
        noopener: true,
      },
      phone: null,
      message: 'Refonte d’une application Angular.',
      status: 'Confirmé',
      reason: null,
    });
  });

  it('Given a phone call without company When its row renders Then the number can be dialled and no company nor video link is shown', async () => {
    const { host } = await render();
    const row = rowOf(host, 'Léo Petit');
    const phone = row && byTestId(row, 'admin-booking-phone');

    expect({
      when: normalized(row && byTestId(row, 'admin-booking-when')),
      format: normalized(row && byTestId(row, 'admin-booking-format')),
      phone: { tag: phone?.tagName, href: phone?.getAttribute('href'), text: normalized(phone) },
      company: row && byTestId(row, 'admin-booking-company'),
      video: row && byTestId(row, 'admin-booking-video'),
    }).toEqual({
      when: 'mardi 20 octobre 2026 à 14:30',
      format: 'Téléphone',
      phone: { tag: 'A', href: 'tel:0612345678', text: '06 12 34 56 78' },
      company: null,
      video: null,
    });
  });

  it('Given a booking cancelled by the visitor When its row renders Then it says who cancelled and why, without a cancel button', async () => {
    const { host } = await render();
    const row = rowOf(host, 'Inès Roux');

    expect({
      status: normalized(row && byTestId(row, 'admin-booking-status')),
      reason: normalized(row && byTestId(row, 'admin-booking-cancel-reason')),
      cancel: row && byTestId(row, 'admin-booking-cancel'),
    }).toEqual({ status: 'Annulé par le visiteur', reason: 'Projet reporté.', cancel: null });
  });
});

describe('AdminBookings: À venir et Passés', () => {
  it('Given the page opens When it renders Then « À venir » is pressed and only the upcoming bookings are requested', async () => {
    const gateway = spies();
    const { host } = await render(gateway);

    expect({
      group: byTestId(host, 'filter-group')?.getAttribute('aria-label'),
      options: allByTestId(host, 'filter-option').map((option) => ({
        label: testIdText(option, 'filter-option-label'),
        pressed: option.getAttribute('aria-pressed'),
      })),
      requested: gateway.getBookings.mock.calls,
    }).toEqual({
      group: 'Filtrer les rendez-vous',
      options: [
        { label: 'À venir', pressed: 'true' },
        { label: 'Passés', pressed: 'false' },
      ],
      requested: [['upcoming']],
    });
  });

  it('Given the upcoming list When « Passés » is pressed Then the past bookings are requested and listed, none of them cancellable', async () => {
    const gateway = spies();
    const rendered = await render(gateway);

    await pressFilter(rendered, 'Passés');

    expect({
      pressed: filterOption(rendered.host, 'Passés')?.getAttribute('aria-pressed'),
      requested: gateway.getBookings.mock.calls,
      names: names(rendered.host),
      cancel: allByTestId(rendered.host, 'admin-booking-cancel').length,
      overline: testIdText(rendered.host, 'admin-page-overline'),
    }).toEqual({
      pressed: 'true',
      requested: [['upcoming'], ['past']],
      names: ['Noé Garnier'],
      cancel: 0,
      overline: '1 rendez-vous passé',
    });
  });

  it('Given the past list When « À venir » is pressed again Then the upcoming bookings are requested and listed again', async () => {
    const gateway = spies();
    const rendered = await render(gateway);
    await pressFilter(rendered, 'Passés');

    await pressFilter(rendered, 'À venir');

    expect({
      requested: gateway.getBookings.mock.calls,
      names: names(rendered.host),
    }).toEqual({
      requested: [['upcoming'], ['past'], ['upcoming']],
      names: ['Camille Martin', 'Léo Petit', 'Inès Roux'],
    });
  });
});

describe('AdminBookings: en-tête de page', () => {
  it('Given three upcoming bookings When the page renders Then its single h1 is « Rendez-vous » under the overline « 3 rendez-vous à venir »', async () => {
    const { host } = await render();

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: '3 rendez-vous à venir', title: 'Rendez-vous', headings: 1 });
  });
});

describe('AdminBookings: chargement, erreur et vide', () => {
  const STATE_TEST_IDS = [
    'admin-bookings-loading',
    'load-error',
    'empty-state',
    'admin-bookings-list',
  ] as const;

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
    { state: 'loading', stream: NEVER, shown: 'admin-bookings-loading' },
    { state: 'failed', stream: throwError(() => new Error('down')), shown: 'load-error' },
    { state: 'empty', stream: of([]), shown: 'empty-state' },
    { state: 'loaded', stream: of([CAMILLE]), shown: 'admin-bookings-list' },
  ])(
    'Given the upcoming bookings are $state When the page renders Then only $shown is shown, under the filters',
    async ({ stream, shown }) => {
      const { host, crash } = await render(spies({ lists: { upcoming: stream } }));

      expect({
        crash,
        present: present(host),
        filters: byTestId(host, 'filter-group') !== null,
      }).toEqual({ crash: null, present: [shown], filters: true });
    },
  );

  it('Given the bookings are loading When the page renders Then the placeholder is announced as a status', async () => {
    const { host } = await render(spies({ lists: { upcoming: NEVER } }));

    expect(byTestId(host, 'admin-bookings-loading')?.getAttribute('role')).toBe('status');
  });

  it('Given the request fails When Réessayer is pressed Then the same list is requested again and shown', async () => {
    let attempts = 0;
    const gateway = spies({
      lists: {
        upcoming: new Observable<readonly AdminBooking[]>((subscriber) => {
          attempts += 1;
          if (attempts === 1) subscriber.error(new Error('down'));
          else {
            subscriber.next([CAMILLE]);
            subscriber.complete();
          }
        }),
      },
    });
    const rendered = await render(gateway);
    const message = testIdText(rendered.host, 'load-error-message');

    await pressTestId(rendered.fixture, 'load-error-retry');

    expect({
      message,
      attempts,
      requested: gateway.getBookings.mock.calls.map(([scope]) => scope),
      names: names(rendered.host),
    }).toEqual({
      message:
        "Les rendez-vous n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.",
      attempts: 2,
      requested: ['upcoming', 'upcoming'],
      names: ['Camille Martin'],
    });
  });

  it('Given no upcoming booking When the page renders Then the empty state says the bookings arrive here', async () => {
    const { host } = await render(spies({ lists: { upcoming: of([]) } }));

    expect({
      stamp: testIdText(host, 'empty-state-stamp'),
      text: normalized(byTestId(host, 'empty-state')?.querySelector('p')),
      overline: testIdText(host, 'admin-page-overline'),
    }).toEqual({
      stamp: 'Agenda libre',
      text: 'Aucun rendez-vous à venir pour le moment. Chaque réservation arrive ici et par e-mail.',
      overline: '0 rendez-vous à venir',
    });
  });

  it('Given no past booking When « Passés » is pressed Then the empty state says the history is empty', async () => {
    const rendered = await render(spies({ lists: { past: of([]) } }));

    await pressFilter(rendered, 'Passés');

    expect({
      stamp: testIdText(rendered.host, 'empty-state-stamp'),
      text: normalized(byTestId(rendered.host, 'empty-state')?.querySelector('p')),
    }).toEqual({
      stamp: 'Historique vide',
      text: 'Aucun rendez-vous passé pour le moment.',
    });
  });
});

describe('AdminBookings: annulation par le propriétaire', () => {
  it('Given confirmed, cancelled and started bookings When the page renders Then only the confirmed ones yet to start offer a cancel button naming them', async () => {
    const { host } = await render(
      spies({ lists: { upcoming: of([STARTED, CAMILLE, LEO, INES]) } }),
    );

    expect({
      names: cancelButtonNames(host),
      tags: allByTestId(host, 'admin-booking-cancel').map((button) => [
        button.tagName,
        button.getAttribute('type'),
      ]),
      started: byTestId(rowOf(host, 'Sacha Blanc') ?? host, 'admin-booking-cancel') !== null,
    }).toEqual({
      names: [
        'Annuler le rendez-vous de Camille Martin le lundi 19 octobre 2026 à 09:00',
        'Annuler le rendez-vous de Léo Petit le mardi 20 octobre 2026 à 14:30',
      ],
      tags: [
        ['BUTTON', 'button'],
        ['BUTTON', 'button'],
      ],
      started: false,
    });
  });

  it('Given the list When the cancel button of Camille Martin is pressed Then a dialog asks to confirm with an empty optional reason, and nothing is cancelled yet', async () => {
    const gateway = spies();
    const rendered = await render(gateway);

    await requestCancellation(rendered, 'Camille Martin');
    const field = reasonField(rendered.host);

    expect({
      dialog: readConfirmDialog(rendered.host),
      field: {
        inDialog: confirmDialogElement(rendered.host)?.contains(field) ?? false,
        value: field?.value,
        maxLength: field?.maxLength,
        label: labelOf(field),
      },
      calls: gateway.cancelBookingAsOwner.mock.calls.length,
    }).toEqual({
      dialog: expect.objectContaining({
        open: true,
        heading: 'Annuler le rendez-vous de Camille Martin ?',
        confirm: 'Annuler le rendez-vous',
        cancel: 'Garder le rendez-vous',
      }),
      field: { inDialog: true, value: '', maxLength: 500, label: 'Motif (facultatif)' },
      calls: 0,
    });
  });

  it.each([
    {
      case: 'a reason typed with spaces around',
      typed: '  Imprévu de mon côté.  ',
      answer: 'confirm' as const,
      calls: [['b-camille', 'Imprévu de mon côté.']],
    },
    {
      case: 'a blank reason',
      typed: '   ',
      answer: 'confirm' as const,
      calls: [['b-camille', null]],
    },
    { case: 'no reason', typed: null, answer: 'confirm' as const, calls: [['b-camille', null]] },
    { case: 'a reason', typed: 'Imprévu.', answer: 'cancel' as const, calls: [] },
    { case: 'a reason', typed: 'Imprévu.', answer: 'escape' as const, calls: [] },
  ])(
    'Given the dialog about Camille Martin and $case When the owner answers $answer Then the gateway receives $calls and the dialog closes',
    async ({ typed, answer, calls }) => {
      const gateway = spies();
      const rendered = await render(gateway);
      await requestCancellation(rendered, 'Camille Martin');
      if (typed !== null) await typeReason(rendered, typed);
      const opened = readConfirmDialog(rendered.host).open;

      await answerConfirmDialog(rendered.fixture, answer);

      expect({
        opened,
        open: readConfirmDialog(rendered.host).open,
        calls: gateway.cancelBookingAsOwner.mock.calls,
      }).toEqual({ opened: true, open: false, calls });
    },
  );

  it('Given a confirmed cancellation When the API accepts it Then the row says it was cancelled by the owner with the reason, the count is refreshed, success is told and the focus lands on the title', async () => {
    const gateway = spies();
    const rendered = await render(gateway);
    await requestCancellation(rendered, 'Camille Martin');
    await typeReason(rendered, 'Imprévu de mon côté.');

    await answerConfirmDialog(rendered.fixture, 'confirm');
    const row = rowOf(rendered.host, 'Camille Martin');
    const title = byTestId(rendered.host, 'admin-page-title');

    expect({
      names: names(rendered.host),
      status: normalized(row && byTestId(row, 'admin-booking-status')),
      reason: normalized(row && byTestId(row, 'admin-booking-cancel-reason')),
      cancelInRow: row && byTestId(row, 'admin-booking-cancel'),
      cancelButtons: cancelButtonNames(rendered.host),
      invalidated: gateway.invalidateUpcomingCount.mock.calls.length,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      focused: title !== null && rendered.host.ownerDocument.activeElement === title,
    }).toEqual({
      names: ['Camille Martin', 'Léo Petit', 'Inès Roux'],
      status: 'Annulé par vous',
      reason: 'Imprévu de mon côté.',
      cancelInRow: null,
      cancelButtons: ['Annuler le rendez-vous de Léo Petit le mardi 20 octobre 2026 à 14:30'],
      invalidated: 1,
      toasts: [
        { severity: 'success', detail: 'Rendez-vous annulé : un e-mail a prévenu Camille Martin' },
      ],
      focused: true,
    });
  });

  it('Given a reason typed then abandoned When another booking is asked to be cancelled Then the dialog names it with an empty reason', async () => {
    const rendered = await render();
    await requestCancellation(rendered, 'Camille Martin');
    await typeReason(rendered, 'Brouillon de motif');
    await answerConfirmDialog(rendered.fixture, 'cancel');

    await requestCancellation(rendered, 'Léo Petit');

    expect({
      heading: readConfirmDialog(rendered.host).heading,
      reason: reasonField(rendered.host)?.value,
    }).toEqual({ heading: 'Annuler le rendez-vous de Léo Petit ?', reason: '' });
  });

  it.each<{ reason: BookingAdminFailure; detail: string }>([
    {
      reason: 'too-late',
      detail: 'Ce rendez-vous a commencé : il ne peut plus être annulé.',
    },
    { reason: 'not-found', detail: 'Ce rendez-vous est introuvable. Rechargez la page.' },
    { reason: 'invalid', detail: 'Le motif dépasse 500 caractères.' },
    {
      reason: 'network',
      detail: 'Annulation impossible : vérifiez votre connexion, puis réessayez.',
    },
    {
      reason: 'server',
      detail: "Annulation impossible : le serveur n'a pas répondu. Réessayez dans un instant.",
    },
  ])(
    'Given the API answers $reason When the cancellation is confirmed Then the row stays confirmed, the count is left alone and « $detail » is told',
    async ({ reason, detail }) => {
      const gateway = spies({ cancel: () => ({ success: false, reason }) });
      const rendered = await render(gateway);
      await requestCancellation(rendered, 'Camille Martin');

      await answerConfirmDialog(rendered.fixture, 'confirm');
      const row = rowOf(rendered.host, 'Camille Martin');

      expect({
        status: normalized(row && byTestId(row, 'admin-booking-status')),
        invalidated: gateway.invalidateUpcomingCount.mock.calls.length,
        toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      }).toEqual({
        status: 'Confirmé',
        invalidated: 0,
        toasts: [{ severity: 'error', detail }],
      });
    },
  );
});
