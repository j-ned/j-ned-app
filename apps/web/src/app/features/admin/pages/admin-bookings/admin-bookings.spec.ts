import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NEVER, Observable, Subject, defer, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AdminBooking,
  BookingAdminFailure,
  BookingAdminResult,
  BookingFeedSubscription,
  BookingScope,
} from '@features/booking/domain/models/booking-admin.model';
import {
  aBookingFeedSubscription,
  anAdminBooking,
} from '@features/booking/testing/booking-builders';
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

const ROSE = anAdminBooking({
  id: 'b-rose',
  startsAt: '2026-09-22T12:00:00.000Z',
  endsAt: '2026-09-22T12:30:00.000Z',
  name: 'Rose Fabre',
  email: 'rose@example.com',
});
const MAEL = anAdminBooking({
  id: 'b-mael',
  startsAt: '2026-10-02T13:00:00.000Z',
  endsAt: '2026-10-02T13:30:00.000Z',
  name: 'Maël Laurent',
  email: 'mael@example.com',
  status: 'cancelled',
  cancelledAt: '2026-10-01T09:00:00.000Z',
  cancelledBy: 'owner',
  cancelReason: null,
});

const LISTS = {
  upcoming: [CAMILLE, LEO],
  past: [NOE],
  archived: [MAEL, INES],
} satisfies Record<string, readonly AdminBooking[]>;

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
  readonly getFeedSubscription: Mock<() => Observable<BookingFeedSubscription>>;
  readonly regenerateFeedSubscription: Mock<
    () => Observable<BookingAdminResult<BookingFeedSubscription>>
  >;
};

const FEED_URL =
  'https://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics';
const NEW_FEED_URL =
  'https://api.example.test/api/booking/feed/newFeedToken0000000000000000000000000000000.ics';
const FEED = aBookingFeedSubscription({ url: FEED_URL, createdAt: '2026-10-15T08:32:00.000Z' });
const NEW_FEED = aBookingFeedSubscription({
  url: NEW_FEED_URL,
  createdAt: '2026-10-15T10:05:00.000Z',
});

function spies(
  options: {
    readonly lists?: Partial<Record<keyof typeof LISTS, Observable<readonly AdminBooking[]>>>;
    readonly cancel?: (id: string, reason: string | null) => BookingAdminResult<AdminBooking>;
    readonly feed?: () => Observable<BookingFeedSubscription>;
    readonly regenerate?: () => Observable<BookingAdminResult<BookingFeedSubscription>>;
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
    getFeedSubscription: vi.fn(
      (): Observable<BookingFeedSubscription> => options.feed?.() ?? defer(() => of(FEED)),
    ),
    regenerateFeedSubscription: vi.fn(
      (): Observable<BookingAdminResult<BookingFeedSubscription>> =>
        options.regenerate?.() ?? defer(() => of({ success: true, data: NEW_FEED } as const)),
    ),
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

const filterGroups = (host: HTMLElement): readonly HTMLElement[] =>
  allByTestId(host, 'filter-group');

const orderGroup = (host: HTMLElement): HTMLElement | null =>
  filterGroups(host).find(
    (group) => group.getAttribute('aria-label') === 'Ordre des rendez-vous',
  ) ?? null;

const optionsOf = (
  group: HTMLElement | null | undefined,
): readonly { readonly label: string; readonly pressed: string | null }[] =>
  group
    ? allByTestId(group, 'filter-option').map((option) => ({
        label: testIdText(option, 'filter-option-label'),
        pressed: option.getAttribute('aria-pressed'),
      }))
    : [];

const pressedOrder = (host: HTMLElement): readonly string[] =>
  optionsOf(orderGroup(host))
    .filter((option) => option.pressed === 'true')
    .map((option) => option.label);

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

// La page porte deux confirmations : celle de l'annulation est celle hors de la section d'abonnement.
const cancellationDialog = (host: HTMLElement): HTMLElement =>
  allByTestId(host, 'confirm-dialog').find(
    (dialog) => dialog.closest('[data-testid="admin-booking-feed"]') === null,
  )?.parentElement ?? host;

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
  it('Given two upcoming bookings When the page renders Then they are listed by date, one list item each', async () => {
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
      items: ['LI', 'LI'],
      names: ['Camille Martin', 'Léo Petit'],
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
});

describe('AdminBookings: À venir, Passés et Archivés', () => {
  it('Given the page opens When it renders Then « À venir » is pressed among the three filters and only the upcoming bookings are requested', async () => {
    const gateway = spies();
    const { host } = await render(gateway);
    const scopes = filterGroups(host)[0];

    expect({
      group: scopes?.getAttribute('aria-label'),
      options: optionsOf(scopes),
      requested: gateway.getBookings.mock.calls,
    }).toEqual({
      group: 'Filtrer les rendez-vous',
      options: [
        { label: 'À venir', pressed: 'true' },
        { label: 'Passés', pressed: 'false' },
        { label: 'Archivés', pressed: 'false' },
      ],
      requested: [['upcoming']],
    });
  });

  it('Given the upcoming list When « Archivés » is pressed Then the cancelled bookings are requested and listed latest first, saying who cancelled and why, none cancellable', async () => {
    const gateway = spies();
    const rendered = await render(gateway);

    await pressFilter(rendered, 'Archivés');

    expect({
      pressed: filterOption(rendered.host, 'Archivés')?.getAttribute('aria-pressed'),
      requested: gateway.getBookings.mock.calls,
      rows: rows(rendered.host).map((row) => ({
        name: testIdText(row, 'admin-booking-name'),
        status: normalized(byTestId(row, 'admin-booking-status')),
        reason: byTestId(row, 'admin-booking-cancel-reason')?.textContent?.trim() ?? null,
      })),
      cancel: allByTestId(rendered.host, 'admin-booking-cancel').length,
      overline: testIdText(rendered.host, 'admin-page-overline'),
    }).toEqual({
      pressed: 'true',
      requested: [['upcoming'], ['archived']],
      rows: [
        { name: 'Inès Roux', status: 'Annulé par le visiteur', reason: 'Projet reporté.' },
        { name: 'Maël Laurent', status: 'Annulé par vous', reason: null },
      ],
      cancel: 0,
      overline: '2 rendez-vous archivés',
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
      names: ['Camille Martin', 'Léo Petit'],
    });
  });
});

describe('AdminBookings: en-tête de page', () => {
  it('Given two upcoming bookings When the page renders Then its single h1 is « Rendez-vous » under the overline « 2 rendez-vous à venir »', async () => {
    const { host } = await render();

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: '2 rendez-vous à venir', title: 'Rendez-vous', headings: 1 });
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

  it('Given no cancelled booking When « Archivés » is pressed Then the empty state says none was cancelled yet, under « Aucun rendez-vous archivé »', async () => {
    const rendered = await render(spies({ lists: { archived: of([]) } }));

    await pressFilter(rendered, 'Archivés');

    expect({
      stamp: testIdText(rendered.host, 'empty-state-stamp'),
      text: normalized(byTestId(rendered.host, 'empty-state')?.querySelector('p')),
      overline: testIdText(rendered.host, 'admin-page-overline'),
    }).toEqual({
      stamp: 'Archives vides',
      text: 'Aucun rendez-vous annulé pour le moment.',
      overline: 'Aucun rendez-vous archivé',
    });
  });
});

describe('AdminBookings: ordre des rendez-vous', () => {
  it('Given the page opens When it renders Then a second group « Ordre des rendez-vous » follows the filters with « Date croissante » pressed', async () => {
    const { host } = await render();

    expect({
      groups: filterGroups(host).map((group) => group.getAttribute('aria-label')),
      options: optionsOf(orderGroup(host)),
    }).toEqual({
      groups: ['Filtrer les rendez-vous', 'Ordre des rendez-vous'],
      options: [
        { label: 'Date croissante', pressed: 'true' },
        { label: 'Date décroissante', pressed: 'false' },
      ],
    });
  });

  it('Given upcoming bookings sent latest first When the page renders Then they are listed soonest first', async () => {
    const { host } = await render(spies({ lists: { upcoming: of([LEO, CAMILLE]) } }));

    expect(names(host)).toEqual(['Camille Martin', 'Léo Petit']);
  });

  it('Given the upcoming list When « Date décroissante » is pressed Then the same bookings are listed latest first, without a new request', async () => {
    const gateway = spies();
    const rendered = await render(gateway);

    await pressFilter(rendered, 'Date décroissante');

    expect({
      pressed: pressedOrder(rendered.host),
      names: names(rendered.host),
      requested: gateway.getBookings.mock.calls,
    }).toEqual({
      pressed: ['Date décroissante'],
      names: ['Léo Petit', 'Camille Martin'],
      requested: [['upcoming']],
    });
  });

  it.each([
    { filter: 'Passés', listed: ['Noé Garnier', 'Rose Fabre'] },
    { filter: 'Archivés', listed: ['Inès Roux', 'Maël Laurent'] },
  ])(
    'Given bookings sent soonest first When « $filter » is pressed Then « Date décroissante » is pressed and they are listed latest first',
    async ({ filter, listed }) => {
      const rendered = await render(spies({ lists: { past: of([ROSE, NOE]) } }));

      await pressFilter(rendered, filter);

      expect({ pressed: pressedOrder(rendered.host), names: names(rendered.host) }).toEqual({
        pressed: ['Date décroissante'],
        names: listed,
      });
    },
  );

  it.each([
    {
      path: 'Date décroissante › Passés › À venir',
      steps: ['Date décroissante', 'Passés', 'À venir'],
      pressed: ['Date croissante'],
      listed: ['Camille Martin', 'Léo Petit'],
    },
    {
      path: 'Passés › Date croissante › Archivés',
      steps: ['Passés', 'Date croissante', 'Archivés'],
      pressed: ['Date décroissante'],
      listed: ['Inès Roux', 'Maël Laurent'],
    },
  ])(
    'Given an order chosen by hand When the owner goes « $path » Then the last list falls back to its own default order',
    async ({ steps, pressed, listed }) => {
      const rendered = await render();

      for (const step of steps) await pressFilter(rendered, step);

      expect({ pressed: pressedOrder(rendered.host), names: names(rendered.host) }).toEqual({
        pressed,
        names: listed,
      });
    },
  );
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
      dialog: readConfirmDialog(cancellationDialog(rendered.host)),
      field: {
        inDialog: confirmDialogElement(cancellationDialog(rendered.host))?.contains(field) ?? false,
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
      const opened = readConfirmDialog(cancellationDialog(rendered.host)).open;

      await answerConfirmDialog(rendered.fixture, answer, cancellationDialog(rendered.host));

      expect({
        opened,
        open: readConfirmDialog(cancellationDialog(rendered.host)).open,
        calls: gateway.cancelBookingAsOwner.mock.calls,
      }).toEqual({ opened: true, open: false, calls });
    },
  );

  it('Given a confirmed cancellation When the API accepts it Then the upcoming list is read again without the cancelled booking, the count is refreshed, success is told and the focus lands on the title', async () => {
    let reads = 0;
    const gateway = spies({
      lists: {
        upcoming: defer(() => {
          reads += 1;
          return of(reads === 1 ? [CAMILLE, LEO] : [LEO]);
        }),
      },
    });
    const rendered = await render(gateway);
    await requestCancellation(rendered, 'Camille Martin');
    await typeReason(rendered, 'Imprévu de mon côté.');

    await answerConfirmDialog(rendered.fixture, 'confirm', cancellationDialog(rendered.host));
    const title = byTestId(rendered.host, 'admin-page-title');

    expect({
      requested: gateway.getBookings.mock.calls,
      names: names(rendered.host),
      overline: testIdText(rendered.host, 'admin-page-overline'),
      cancelButtons: cancelButtonNames(rendered.host),
      invalidated: gateway.invalidateUpcomingCount.mock.calls.length,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      focused: title !== null && rendered.host.ownerDocument.activeElement === title,
    }).toEqual({
      requested: [['upcoming'], ['upcoming']],
      names: ['Léo Petit'],
      overline: '1 rendez-vous à venir',
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
    await answerConfirmDialog(rendered.fixture, 'cancel', cancellationDialog(rendered.host));

    await requestCancellation(rendered, 'Léo Petit');

    expect({
      heading: readConfirmDialog(cancellationDialog(rendered.host)).heading,
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
    'Given the API answers $reason When the cancellation is confirmed Then the row stays confirmed, the list is not reloaded, the count is left alone and « $detail » is told',
    async ({ reason, detail }) => {
      const gateway = spies({ cancel: () => ({ success: false, reason }) });
      const rendered = await render(gateway);
      await requestCancellation(rendered, 'Camille Martin');

      await answerConfirmDialog(rendered.fixture, 'confirm', cancellationDialog(rendered.host));
      const row = rowOf(rendered.host, 'Camille Martin');

      expect({
        status: normalized(row && byTestId(row, 'admin-booking-status')),
        requested: gateway.getBookings.mock.calls,
        invalidated: gateway.invalidateUpcomingCount.mock.calls.length,
        toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      }).toEqual({
        status: 'Confirmé',
        requested: [['upcoming']],
        invalidated: 0,
        toasts: [{ severity: 'error', detail }],
      });
    },
  );
});

const feedSection = (host: HTMLElement): HTMLElement | null => byTestId(host, 'admin-booking-feed');

const inFeed = (host: HTMLElement, testId: string): HTMLElement | null => {
  const section = feedSection(host);
  return section && byTestId(section, testId);
};

const collapsed = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

const feedAction = (host: HTMLElement): HTMLElement | null =>
  inFeed(host, 'admin-booking-feed-action');

const feedDialog = (host: HTMLElement): HTMLElement => feedSection(host) ?? host;

async function pressFeedAction(rendered: Rendered): Promise<void> {
  const action = feedAction(rendered.host);
  action?.focus();
  action?.click();
  await settleBounded(rendered.fixture);
}

const feedUrlField = (host: HTMLElement): HTMLInputElement | null => {
  const field = inFeed(host, 'admin-booking-feed-url');
  return field instanceof HTMLInputElement ? field : null;
};

const storedValues = (): readonly string[] =>
  [localStorage, sessionStorage].flatMap((storage) =>
    Array.from({ length: storage.length }, (_, index) => {
      const key = storage.key(index);
      return key === null ? '' : `${key}=${storage.getItem(key) ?? ''}`;
    }),
  );

const FEED_HELP = [
  "iPhone : touchez « Ouvrir dans Calendrier » puis « S'abonner », ou, dans Calendrier, Calendriers › Ajouter un calendrier › Ajouter un calendrier avec abonnement, et collez le lien. Le rythme de mise à jour suit le réglage de l'iPhone (Calendrier › Comptes › Récupérer).",
  "Google Agenda (ordinateur) : Autres agendas › + › À partir de l'URL, collez le lien. Google met l'agenda à jour toutes les quelques heures : une annulation peut y rester visible jusqu'à un jour.",
  'Ce lien donne accès aux coordonnées de vos visiteurs : ne le partagez pas. En cas de doute, régénérez-le.',
  "Une fois abonné, n'ajoutez plus les rendez-vous à la main depuis l'email : ces copies ne suivent pas les annulations.",
];

const FEED_CREATED = "Lien d'abonnement créé : ajoutez-le à vos agendas.";
const FEED_REGENERATED =
  "Nouveau lien créé : l'ancien ne fonctionne plus. Remplacez-le dans vos agendas.";

describe("AdminBookings: section « Abonnement d'agenda »", () => {
  it('Given the page When it renders Then the section follows the list, is labelled by its h2 under the single h1, and adds no landmark', async () => {
    const { host } = await render();
    const section = feedSection(host);
    const heading = inFeed(host, 'admin-booking-feed-heading');
    const list = byTestId(host, 'admin-bookings-list');
    const following =
      list !== null &&
      section !== null &&
      (list.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    expect({
      tag: section?.tagName,
      labelledBy: section?.getAttribute('aria-labelledby'),
      heading: { tag: heading?.tagName, id: heading?.id, text: collapsed(heading) },
      following,
      h1: host.querySelectorAll('h1').length,
      landmarks:
        section?.querySelectorAll(
          'header, main, footer, nav, aside, [role="banner"], [role="main"], [role="contentinfo"], [role="navigation"], [role="complementary"], [role="region"]',
        ).length ?? null,
    }).toEqual({
      tag: 'SECTION',
      labelledBy: heading?.id,
      heading: { tag: 'H2', id: expect.stringMatching(/.+/), text: "Abonnement d'agenda" },
      following: true,
      h1: 1,
      landmarks: 0,
    });
  });

  it('Given an active link on the server When the page loads Then the link is shown read-only and selectable, with its webcal twin, its creation date, the help and the regenerate button', async () => {
    const gateway = spies();
    const { host } = await render(gateway);
    const field = feedUrlField(host);
    const webcal = inFeed(host, 'admin-booking-feed-webcal');
    const help = inFeed(host, 'admin-booking-feed-help');
    const action = feedAction(host);

    expect({
      reads: gateway.getFeedSubscription.mock.calls.length,
      field: {
        type: field?.type,
        readOnly: field?.readOnly,
        disabled: field?.disabled,
        value: field?.value,
        label: collapsed(
          field && field.id !== '' ? host.querySelector(`label[for="${field.id}"]`) : null,
        ),
      },
      webcal: {
        tag: webcal?.tagName,
        href: webcal?.getAttribute('href'),
        name: webcal ? accessibleName(webcal, host) : null,
      },
      since: collapsed(inFeed(host, 'admin-booking-feed-since')),
      help: {
        tag: help?.tagName,
        role: help?.getAttribute('role'),
        items: [...(help?.querySelectorAll('li') ?? [])].map((item) => collapsed(item)),
      },
      action: { tag: action?.tagName, type: action?.getAttribute('type'), text: collapsed(action) },
      none: inFeed(host, 'admin-booking-feed-none'),
      unconfigured: inFeed(host, 'admin-booking-feed-unconfigured'),
    }).toEqual({
      reads: 1,
      field: {
        type: 'text',
        readOnly: true,
        disabled: false,
        value: FEED_URL,
        label: "Lien d'abonnement",
      },
      webcal: {
        tag: 'A',
        href: 'webcal://api.example.test/api/booking/feed/stubFeedToken000000000000000000000000000000.ics',
        name: 'Ouvrir dans Calendrier',
      },
      since: 'Lien créé le jeudi 15 octobre 2026 à 10:32.',
      help: { tag: 'UL', role: 'list', items: FEED_HELP },
      action: { tag: 'BUTTON', type: 'button', text: 'Régénérer le lien' },
      none: null,
      unconfigured: null,
    });
  });

  it('Given no link yet When the page loads Then it says so and offers to create one, without link nor help', async () => {
    const { host } = await render(spies({ feed: () => of({ kind: 'none' }) }));

    expect({
      none: collapsed(inFeed(host, 'admin-booking-feed-none')),
      action: collapsed(feedAction(host)),
      url: inFeed(host, 'admin-booking-feed-url'),
      webcal: inFeed(host, 'admin-booking-feed-webcal'),
      since: inFeed(host, 'admin-booking-feed-since'),
      help: inFeed(host, 'admin-booking-feed-help'),
    }).toEqual({
      none: "Aucun lien d'abonnement pour l'instant.",
      action: "Créer le lien d'abonnement",
      url: null,
      webcal: null,
      since: null,
      help: null,
    });
  });

  it('Given the API without its secret When the page loads Then the section names the variable to set, with no button, link nor help', async () => {
    const { host } = await render(spies({ feed: () => of({ kind: 'unconfigured' }) }));

    expect({
      section: feedSection(host) !== null,
      message: collapsed(inFeed(host, 'admin-booking-feed-unconfigured')),
      buttons: feedSection(host)?.querySelectorAll('button').length ?? null,
      url: inFeed(host, 'admin-booking-feed-url'),
      webcal: inFeed(host, 'admin-booking-feed-webcal'),
      help: inFeed(host, 'admin-booking-feed-help'),
    }).toEqual({
      section: true,
      message:
        "Abonnement non configuré : ajoutez la variable BOOKING_FEED_SECRET (32 caractères au moins, par exemple la sortie de openssl rand -base64 48) à l'environnement de l'API dans Dokploy, puis redéployez l'API.",
      buttons: 0,
      url: null,
      webcal: null,
      help: null,
    });
  });

  it('Given the subscription still on its way When the page renders Then the section announces its loading as a status, without action', async () => {
    const { host } = await render(spies({ feed: () => NEVER }));
    const loading = inFeed(host, 'admin-booking-feed-loading');

    expect({
      role: loading?.getAttribute('role'),
      text: collapsed(loading),
      action: feedAction(host),
    }).toEqual({ role: 'status', text: "Chargement de l'abonnement…", action: null });
  });

  it('Given the read fails When Réessayer is pressed in the section Then the subscription is read again and the link shown', async () => {
    let attempts = 0;
    const gateway = spies({
      feed: () =>
        defer(() => {
          attempts += 1;
          return attempts === 1 ? throwError(() => new Error('down')) : of(FEED);
        }),
    });
    const rendered = await render(gateway);
    const failed = {
      message: collapsed(inFeed(rendered.host, 'load-error-message')),
      action: feedAction(rendered.host),
    };

    inFeed(rendered.host, 'load-error-retry')?.click();
    await settleBounded(rendered.fixture);

    expect({
      failed,
      reads: gateway.getFeedSubscription.mock.calls.length,
      value: feedUrlField(rendered.host)?.value,
      list: names(rendered.host),
    }).toEqual({
      failed: {
        message:
          "L'abonnement d'agenda n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez.",
        action: null,
      },
      reads: 2,
      value: FEED_URL,
      list: ['Camille Martin', 'Léo Petit'],
    });
  });
});

describe("AdminBookings: création et régénération du lien d'abonnement", () => {
  it('Given no link yet When « Créer le lien d’abonnement » is pressed Then the link is created without confirmation, shown, told, and the focus stays on the same button now offering to regenerate', async () => {
    const gateway = spies({ feed: () => of({ kind: 'none' }) });
    const rendered = await render(gateway);
    const before = feedAction(rendered.host);

    await pressFeedAction(rendered);
    const after = feedAction(rendered.host);

    expect({
      dialog: readConfirmDialog(feedDialog(rendered.host)).open,
      requests: gateway.regenerateFeedSubscription.mock.calls.length,
      value: feedUrlField(rendered.host)?.value,
      since: collapsed(inFeed(rendered.host, 'admin-booking-feed-since')),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      same: before !== null && before === after,
      focused: after !== null && rendered.host.ownerDocument.activeElement === after,
      label: collapsed(after),
    }).toEqual({
      dialog: false,
      requests: 1,
      value: NEW_FEED_URL,
      since: 'Lien créé le jeudi 15 octobre 2026 à 12:05.',
      toasts: [{ severity: 'success', detail: FEED_CREATED }],
      same: true,
      focused: true,
      label: 'Régénérer le lien',
    });
  });

  it('Given an active link When « Régénérer le lien » is pressed Then a confirmation explains the old link stops working everywhere, and nothing is sent yet', async () => {
    const gateway = spies();
    const rendered = await render(gateway);

    await pressFeedAction(rendered);
    const dialog = readConfirmDialog(feedDialog(rendered.host));

    expect({
      dialog: {
        open: dialog.open,
        heading: dialog.heading.replace(/\s+/g, ' '),
        description: dialog.description.replace(/\s+/g, ' '),
        confirm: dialog.confirm,
        cancel: dialog.cancel,
      },
      requests: gateway.regenerateFeedSubscription.mock.calls.length,
    }).toEqual({
      dialog: {
        open: true,
        heading: "Régénérer le lien d'abonnement ?",
        description:
          "L'ancien lien cessera aussitôt de fonctionner sur tous vos appareils : les agendas qui y sont abonnés ne recevront plus vos rendez-vous tant que vous ne les aurez pas abonnés au nouveau.",
        confirm: 'Régénérer le lien',
        cancel: 'Garder le lien actuel',
      },
      requests: 0,
    });
  });

  it('Given the confirmation When it is accepted Then one request is sent, the new link replaces the old one, the owner is told and the focus is back on the same button', async () => {
    const gateway = spies();
    const rendered = await render(gateway);
    const before = feedAction(rendered.host);
    await pressFeedAction(rendered);

    await answerConfirmDialog(rendered.fixture, 'confirm', feedDialog(rendered.host));
    const after = feedAction(rendered.host);

    expect({
      open: readConfirmDialog(feedDialog(rendered.host)).open,
      requests: gateway.regenerateFeedSubscription.mock.calls.length,
      value: feedUrlField(rendered.host)?.value,
      webcal: inFeed(rendered.host, 'admin-booking-feed-webcal')?.getAttribute('href'),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      same: before !== null && before === after,
      focused: after !== null && rendered.host.ownerDocument.activeElement === after,
      cancellations: gateway.cancelBookingAsOwner.mock.calls.length,
    }).toEqual({
      open: false,
      requests: 1,
      value: NEW_FEED_URL,
      webcal:
        'webcal://api.example.test/api/booking/feed/newFeedToken0000000000000000000000000000000.ics',
      toasts: [{ severity: 'success', detail: FEED_REGENERATED }],
      same: true,
      focused: true,
      cancellations: 0,
    });
  });

  it.each(['cancel', 'escape'] as const)(
    'Given the confirmation When the owner answers %s Then nothing is sent and the current link stays',
    async (answer) => {
      const gateway = spies();
      const rendered = await render(gateway);
      await pressFeedAction(rendered);
      const opened = readConfirmDialog(feedDialog(rendered.host)).open;

      await answerConfirmDialog(rendered.fixture, answer, feedDialog(rendered.host));

      expect({
        opened,
        open: readConfirmDialog(feedDialog(rendered.host)).open,
        requests: gateway.regenerateFeedSubscription.mock.calls.length,
        value: feedUrlField(rendered.host)?.value,
        toasts: rendered.toast.add.mock.calls.length,
      }).toEqual({ opened: true, open: false, requests: 0, value: FEED_URL, toasts: 0 });
    },
  );

  it('Given a creation in flight When the button is pressed again Then it is marked unavailable, a single request is sent, and it is available again after the answer', async () => {
    const answer = new Subject<BookingAdminResult<BookingFeedSubscription>>();
    const gateway = spies({ feed: () => of({ kind: 'none' }), regenerate: () => answer });
    const rendered = await render(gateway);

    await pressFeedAction(rendered);
    await pressFeedAction(rendered);
    const meanwhile = {
      requests: gateway.regenerateFeedSubscription.mock.calls.length,
      unavailable: feedAction(rendered.host)?.getAttribute('aria-disabled'),
      disabled: feedAction(rendered.host)?.hasAttribute('disabled'),
    };
    answer.next({ success: true, data: NEW_FEED });
    answer.complete();
    await settleBounded(rendered.fixture);

    expect({
      meanwhile,
      unavailable: feedAction(rendered.host)?.getAttribute('aria-disabled') ?? null,
      value: feedUrlField(rendered.host)?.value,
    }).toEqual({
      meanwhile: { requests: 1, unavailable: 'true', disabled: false },
      unavailable: null,
      value: NEW_FEED_URL,
    });
  });

  it('Given a regeneration in flight When the button is pressed again Then no new confirmation opens and no second request is sent', async () => {
    const answer = new Subject<BookingAdminResult<BookingFeedSubscription>>();
    const gateway = spies({ regenerate: () => answer });
    const rendered = await render(gateway);
    await pressFeedAction(rendered);
    await answerConfirmDialog(rendered.fixture, 'confirm', feedDialog(rendered.host));

    await pressFeedAction(rendered);

    expect({
      open: readConfirmDialog(feedDialog(rendered.host)).open,
      requests: gateway.regenerateFeedSubscription.mock.calls.length,
      unavailable: feedAction(rendered.host)?.getAttribute('aria-disabled'),
    }).toEqual({ open: false, requests: 1, unavailable: 'true' });
  });

  it('Given the API cannot be reached When the regeneration is confirmed Then the failure is told and the previous link stays', async () => {
    const gateway = spies({
      regenerate: () => defer(() => of({ success: false, reason: 'network' } as const)),
    });
    const rendered = await render(gateway);
    await pressFeedAction(rendered);

    await answerConfirmDialog(rendered.fixture, 'confirm', feedDialog(rendered.host));

    expect({
      value: feedUrlField(rendered.host)?.value,
      since: collapsed(inFeed(rendered.host, 'admin-booking-feed-since')),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      unavailable: feedAction(rendered.host)?.getAttribute('aria-disabled') ?? null,
    }).toEqual({
      value: FEED_URL,
      since: 'Lien créé le jeudi 15 octobre 2026 à 10:32.',
      toasts: [
        {
          severity: 'error',
          detail: 'Création impossible : vérifiez votre connexion, puis réessayez.',
        },
      ],
      unavailable: null,
    });
  });

  it('Given the secret removed from the API When a link is created Then the owner is told, the section switches to the unconfigured message without button and the focus lands on its heading', async () => {
    let reads = 0;
    const gateway = spies({
      feed: () =>
        defer(() => {
          reads += 1;
          return of<BookingFeedSubscription>(
            reads === 1 ? { kind: 'none' } : { kind: 'unconfigured' },
          );
        }),
      regenerate: () => defer(() => of({ success: false, reason: 'not-configured' } as const)),
    });
    const rendered = await render(gateway);

    await pressFeedAction(rendered);

    const heading = inFeed(rendered.host, 'admin-booking-feed-heading');

    expect({
      reads: gateway.getFeedSubscription.mock.calls.length,
      unconfigured: inFeed(rendered.host, 'admin-booking-feed-unconfigured') !== null,
      action: feedAction(rendered.host),
      focused: heading !== null && rendered.host.ownerDocument.activeElement === heading,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
    }).toEqual({
      reads: 2,
      unconfigured: true,
      action: null,
      focused: true,
      toasts: [
        {
          severity: 'error',
          detail: "Abonnement non configuré : ajoutez BOOKING_FEED_SECRET à l'API.",
        },
      ],
    });
  });

  it('Given a link read then created When the storages are inspected Then neither link was written there', async () => {
    localStorage.clear();
    sessionStorage.clear();
    const rendered = await render(spies({ feed: () => of({ kind: 'none' }) }));
    const afterRead = storedValues();

    await pressFeedAction(rendered);
    const afterCreation = storedValues();

    expect({
      shown: feedUrlField(rendered.host)?.value,
      leaked: [...afterRead, ...afterCreation].filter(
        (entry) => entry.includes('FeedToken') || entry.includes('/booking/feed/'),
      ),
    }).toEqual({ shown: NEW_FEED_URL, leaked: [] });
  });
});

const FEED_COPIED = 'Lien copié dans le presse-papiers';
const FEED_COPY_FAILED = 'Copie impossible\u00a0: sélectionnez le lien et copiez-le à la main.';

const feedCopy = (host: HTMLElement): HTMLElement | null => inFeed(host, 'admin-booking-feed-copy');

async function pressFeedCopy(rendered: Rendered): Promise<void> {
  const copy = feedCopy(rendered.host);
  copy?.focus();
  copy?.click();
  await settleBounded(rendered.fixture);
}

describe("AdminBookings: copie du lien d'abonnement", () => {
  beforeEach(async () => {
    await navigator.clipboard.writeText('avant');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given an active link When « Copier le lien » is pressed Then its https address reaches the clipboard, the copy is told and the focus stays on the button', async () => {
    const gateway = spies();
    const rendered = await render(gateway);
    const before = feedCopy(rendered.host);
    const button = {
      tag: before?.tagName,
      type: before?.getAttribute('type'),
      name: before ? accessibleName(before, rendered.host) : null,
    };

    await pressFeedCopy(rendered);
    const after = feedCopy(rendered.host);

    expect({
      button,
      clipboard: await navigator.clipboard.readText(),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      same: before !== null && before === after,
      focused: after !== null && rendered.host.ownerDocument.activeElement === after,
      requests: gateway.regenerateFeedSubscription.mock.calls.length,
    }).toEqual({
      button: { tag: 'BUTTON', type: 'button', name: 'Copier le lien' },
      clipboard: FEED_URL,
      toasts: [{ severity: 'success', detail: FEED_COPIED }],
      same: true,
      focused: true,
      requests: 0,
    });
  });

  it('Given a clipboard that refuses the text When « Copier le lien » is pressed Then the owner is told to select the link, which stays shown', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('The request is not allowed', 'NotAllowedError'),
    );
    const rendered = await render();

    await pressFeedCopy(rendered);

    expect({
      clipboard: await navigator.clipboard.readText(),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      value: feedUrlField(rendered.host)?.value,
    }).toEqual({
      clipboard: 'avant',
      toasts: [{ severity: 'error', detail: FEED_COPY_FAILED }],
      value: FEED_URL,
    });
  });

  it('Given no link yet When the page loads Then nothing offers a copy, until the link is created and its copy copies the new address', async () => {
    const rendered = await render(spies({ feed: () => of({ kind: 'none' }) }));
    const beforeCreation = feedCopy(rendered.host);

    await pressFeedAction(rendered);
    rendered.toast.add.mockClear();
    await pressFeedCopy(rendered);

    expect({
      beforeCreation,
      clipboard: await navigator.clipboard.readText(),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
    }).toEqual({
      beforeCreation: null,
      clipboard: NEW_FEED_URL,
      toasts: [{ severity: 'success', detail: FEED_COPIED }],
    });
  });
});
