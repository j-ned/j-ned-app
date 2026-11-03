import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminMessages } from './admin-messages';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import type { ToastMessage } from '@shared/ui/toast.types';
import { API_BASE_URL } from '@shared/api/api-config';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { HttpContactGateway } from '@features/contact/infra/gateways/http-contact.gateway';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

const msg = makeContactMessage;

const CLAIRE = makeContactMessage({
  id: 1,
  name: 'Claire Martin',
  message: 'Bonjour, je voudrais un devis.',
  createdAt: '2026-10-06T10:00:00Z',
  read: false,
});
const PAUL = makeContactMessage({
  id: 2,
  name: 'Paul Durand',
  message: 'Merci pour le retour.',
  createdAt: '2026-10-01T10:00:00Z',
  read: true,
});

function makeGateway(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return stubContactGateway({ markMessageAsRead: () => of(msg({ read: true })), ...overrides });
}

type Toasts = { readonly add: Mock<(message: ToastMessage) => void> };

const severities = (toast: Toasts): readonly (string | undefined)[] =>
  toast.add.mock.calls.map(([entry]) => entry.severity);

async function setup(gateway: ContactGateway = makeGateway()): Promise<{
  fixture: ComponentFixture<AdminMessages>;
  host: HTMLElement;
  toast: Toasts;
}> {
  const toast: Toasts = { add: vi.fn<(message: ToastMessage) => void>() };
  TestBed.configureTestingModule({
    providers: [
      { provide: ContactGateway, useValue: gateway },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminMessages);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, toast };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeButton = (element: HTMLElement | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const allByTestId = (host: HTMLElement, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const senders = (host: HTMLElement): readonly string[] =>
  allByTestId(host, 'message-sender').map((element) => normalized(element));

const filterOption = (host: HTMLElement, label: string): HTMLElement | null =>
  allByTestId(host, 'filter-option').find(
    (option) => testIdText(option, 'filter-option-label') === label,
  ) ?? null;

async function pressFilter(
  fixture: ComponentFixture<AdminMessages>,
  host: HTMLElement,
  label: string,
): Promise<void> {
  filterOption(host, label)?.click();
  await settleBounded(fixture);
}

describe('AdminMessages: liste', () => {
  it('Given messages in any order When the page renders Then they are listed newest first', async () => {
    const { host } = await setup(
      makeGateway({
        getAllMessages: () =>
          of([
            msg({ id: 1, name: 'Ancien', createdAt: '2026-09-01T10:00:00Z' }),
            msg({ id: 2, name: 'Récent', createdAt: '2026-10-06T10:00:00Z' }),
            msg({ id: 3, name: 'Moyen', createdAt: '2026-09-20T10:00:00Z' }),
          ]),
      }),
    );

    expect(senders(host)).toEqual(['Récent', 'Moyen', 'Ancien']);
  });
});

describe('AdminMessages: filtre par lecture', () => {
  const seed = (): ContactGateway => makeGateway({ getAllMessages: () => of([CLAIRE, PAUL]) });

  it.each([
    { label: 'Non lus', shown: ['Claire Martin'] },
    { label: 'Tous', shown: ['Claire Martin', 'Paul Durand'] },
  ])(
    'Given the inbox When « $label » is pressed Then only $shown are listed',
    async ({ label, shown }) => {
      const { fixture, host } = await setup(seed());
      await pressFilter(fixture, host, 'Lus');

      await pressFilter(fixture, host, label);

      expect({
        pressed: filterOption(host, label)?.getAttribute('aria-pressed'),
        senders: senders(host),
      }).toEqual({ pressed: 'true', senders: shown });
    },
  );
});

describe('AdminMessages: lecture au clavier', () => {
  async function renderInbox(): Promise<{
    fixture: ComponentFixture<AdminMessages>;
    host: HTMLElement;
    markMessageAsRead: ReturnType<typeof vi.fn>;
  }> {
    const markMessageAsRead = vi.fn((): Observable<ContactMessage> =>
      of({ ...CLAIRE, read: true }),
    );
    const { fixture, host } = await setup(
      makeGateway({ getAllMessages: () => of([CLAIRE, PAUL]), markMessageAsRead }),
    );
    return { fixture, host, markMessageAsRead };
  }

  const expandButtons = (host: HTMLElement): readonly (HTMLButtonElement | null)[] =>
    allByTestId(host, 'message-expand').map(nativeButton);

  it('Given the inbox When the first expand button is pressed Then the message body it controls is shown and the button can hide it', async () => {
    const { fixture, host } = await renderInbox();

    await pressTestId(fixture, 'message-expand', 0);
    const button = expandButtons(host)[0] ?? null;
    const bodies = allByTestId(host, 'message-body');

    expect({
      expanded: button?.getAttribute('aria-expanded'),
      controls: button?.getAttribute('aria-controls'),
      name: normalized(button),
      bodies: bodies.map((body) => ({ id: body.id, text: normalized(body) })),
    }).toEqual({
      expanded: 'true',
      controls: 'message-body-1',
      name: 'Masquer le message de Claire Martin',
      bodies: [{ id: 'message-body-1', text: 'Bonjour, je voudrais un devis.' }],
    });
  });
});

describe('AdminMessages: marquer comme lu', () => {
  it('Given an unread message When it is marked as read Then its stamp and action go, the unread count is refreshed and success is told', async () => {
    const invalidate = vi.fn();
    const { fixture, host, toast } = await setup(
      makeGateway({
        getAllMessages: () => of([CLAIRE, PAUL]),
        markMessageAsRead: () => of({ ...CLAIRE, read: true }),
        invalidateUnreadCount: invalidate,
      }),
    );

    await pressTestId(fixture, 'message-mark-read', 0);

    expect({
      stamps: allByTestId(host, 'message-new').length,
      actions: allByTestId(host, 'message-mark-read').length,
      invalidated: invalidate.mock.calls.length,
      toasts: severities(toast),
    }).toEqual({ stamps: 0, actions: 0, invalidated: 1, toasts: ['success'] });
  });

  it('Given the update fails When a message is marked as read Then it stays unread and an error is told', async () => {
    const { fixture, host, toast } = await setup(
      makeGateway({
        getAllMessages: () => of([CLAIRE]),
        markMessageAsRead: () => throwError(() => new Error('boom')),
      }),
    );

    await pressTestId(fixture, 'message-mark-read', 0);

    expect({
      stamps: allByTestId(host, 'message-new').length,
      toasts: severities(toast),
    }).toEqual({ stamps: 1, toasts: ['error'] });
  });
});

describe('AdminMessages: tout marquer comme lu', () => {
  it('Given two unread messages When « Tout marquer comme lu » is pressed Then every row is read at once, the count refreshed and success told', async () => {
    const invalidate = vi.fn();
    const markAllRead = vi.fn(() => of({ count: 2 }));
    const { fixture, host, toast } = await setup(
      makeGateway({
        getAllMessages: () => of([CLAIRE, { ...PAUL, read: false }]),
        markAllRead,
        invalidateUnreadCount: invalidate,
      }),
    );
    const disabledBefore = byTestId(host, 'mark-all-read')?.getAttribute('aria-disabled') ?? null;

    await pressTestId(fixture, 'mark-all-read');

    expect({
      disabledBefore,
      calls: markAllRead.mock.calls.length,
      stamps: allByTestId(host, 'message-new').length,
      invalidated: invalidate.mock.calls.length,
      toasts: severities(toast),
      disabledAfter: byTestId(host, 'mark-all-read')?.getAttribute('aria-disabled') ?? null,
    }).toEqual({
      disabledBefore: null,
      calls: 1,
      stamps: 0,
      invalidated: 1,
      toasts: ['success'],
      disabledAfter: 'true',
    });
  });

  it('Given the update fails When « Tout marquer comme lu » is pressed Then the rows are back as they were and an error is told', async () => {
    const { fixture, host, toast } = await setup(
      makeGateway({
        getAllMessages: () => of([CLAIRE, PAUL]),
        markAllRead: () => throwError(() => new Error('boom')),
      }),
    );

    await pressTestId(fixture, 'mark-all-read');

    expect({
      stamps: allByTestId(host, 'message-new').length,
      toasts: severities(toast),
    }).toEqual({ stamps: 1, toasts: ['error'] });
  });
});

describe('AdminMessages: suppression confirmée', () => {
  async function renderList(): Promise<{
    fixture: ComponentFixture<AdminMessages>;
    host: HTMLElement;
    deleteMessage: ReturnType<typeof vi.fn>;
    invalidate: ReturnType<typeof vi.fn>;
    toast: Toasts;
  }> {
    const deleteMessage = vi.fn((): Observable<void> => of(undefined));
    const invalidate = vi.fn();
    const { fixture, host, toast } = await setup(
      makeGateway({
        getAllMessages: () => of([CLAIRE, PAUL]),
        deleteMessage,
        invalidateUnreadCount: invalidate,
      }),
    );
    return { fixture, host, deleteMessage, invalidate, toast };
  }

  it.each([
    { answer: 'confirm' as const, deleted: [[1]], shown: ['Paul Durand'] },
    { answer: 'cancel' as const, deleted: [], shown: ['Claire Martin', 'Paul Durand'] },
    { answer: 'escape' as const, deleted: [], shown: ['Claire Martin', 'Paul Durand'] },
  ])(
    'Given the dialog asks about the message from Claire Martin When the user answers $answer Then the gateway deletes $deleted and the dialog closes',
    async ({ answer, deleted, shown }) => {
      const { fixture, host, deleteMessage } = await renderList();
      await pressTestId(fixture, 'message-delete', 0);

      await answerConfirmDialog(fixture, answer);

      expect({
        open: readConfirmDialog(host).open,
        deleted: deleteMessage.mock.calls,
        senders: senders(host),
      }).toEqual({ open: false, deleted, senders: shown });
    },
  );

  it('Given a confirmed deletion When the row disappears Then the unread count is refreshed and success is told', async () => {
    const { fixture, invalidate, toast } = await renderList();
    await pressTestId(fixture, 'message-delete', 0);

    await answerConfirmDialog(fixture, 'confirm');

    expect({
      invalidated: invalidate.mock.calls.length,
      toasts: severities(toast),
    }).toEqual({ invalidated: 1, toasts: ['success'] });
  });

  it('Given the deletion fails When it is confirmed Then the message is back in the list and an error is told', async () => {
    const { fixture, host, toast } = await setup(
      makeGateway({
        getAllMessages: () => of([CLAIRE, PAUL]),
        deleteMessage: () => throwError(() => new Error('boom')),
      }),
    );
    await pressTestId(fixture, 'message-delete', 0);

    await answerConfirmDialog(fixture, 'confirm');

    expect({
      senders: senders(host),
      toasts: severities(toast),
    }).toEqual({ senders: ['Claire Martin', 'Paul Durand'], toasts: ['error'] });
  });

  it('Given a confirmed deletion When the row disappears Then the focus lands on the page title', async () => {
    const { fixture, host } = await renderList();
    await pressTestId(fixture, 'message-delete', 0);

    await answerConfirmDialog(fixture, 'confirm');
    const title = byTestId(host, 'admin-page-title');

    expect({
      tag: title?.tagName,
      tabindex: title?.getAttribute('tabindex'),
      focused: title !== null && host.ownerDocument.activeElement === title,
    }).toEqual({ tag: 'H1', tabindex: '-1', focused: true });
  });
});

describe('AdminMessages: chargement, erreur et vide', () => {
  const STATE_TEST_IDS = ['load-error', 'empty-state', 'admin-messages-list'] as const;

  async function renderWith(getAllMessages: ContactGateway['getAllMessages']): Promise<{
    fixture: ComponentFixture<AdminMessages>;
    host: HTMLElement;
    crash: unknown;
  }> {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContactGateway, useValue: makeGateway({ getAllMessages }) },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AdminMessages);
    const crash = await captureCrash(() => settleBounded(fixture));
    return { fixture, host: fixture.nativeElement as HTMLElement, crash };
  }

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
    {
      state: 'failed',
      stream: throwError(() => new Error('down')),
      shown: 'load-error',
    },
    { state: 'empty', stream: of([]), shown: 'empty-state' },
    { state: 'loaded', stream: of([makeContactMessage()]), shown: 'admin-messages-list' },
  ])(
    'Given the inbox is $state When the page renders Then only $shown is shown',
    async ({ stream, shown }) => {
      const { host, crash } = await renderWith(() => stream);

      expect({ crash, present: present(host) }).toEqual({ crash: null, present: [shown] });
    },
  );
});

describe('AdminMessages: relance après une erreur HTTP', () => {
  const URL = '/api/contact/messages';
  let httpController: HttpTestingController;

  afterEach(() => {
    httpController.verify();
  });

  it('Given the inbox request fails When Réessayer is pressed Then a new GET is sent and the messages are shown', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ContactGateway, useClass: HttpContactGateway },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
    });
    httpController = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminMessages);
    fixture.detectChanges();
    httpController.expectOne(URL).flush('down', { status: 503, statusText: 'Unavailable' });
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const alertShown = byTestId(host, 'load-error')?.getAttribute('role') === 'alert';

    const crash = await captureCrash(() => pressTestId(fixture, 'load-error-retry'));
    const retried = httpController.match(URL);
    retried.forEach((request) => request.flush({ data: [makeContactMessage()] }));
    await settle(fixture);
    await settle(fixture);

    expect({
      crash,
      alertShown,
      retried: retried.length,
      list: byTestId(host, 'admin-messages-list') !== null,
    }).toEqual({ crash: null, alertShown: true, retried: 1, list: true });
  });
});

describe('AdminMessages: une seule notification par échec d’écriture', () => {
  const BASE = '/api/contact/messages';
  let httpController: HttpTestingController;

  afterEach(() => {
    httpController.verify();
  });

  async function renderOverHttp(): Promise<{
    fixture: ComponentFixture<AdminMessages>;
    toasts: ToastStore;
  }> {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ContactGateway, useClass: HttpContactGateway },
      ],
    });
    httpController = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminMessages);
    fixture.detectChanges();
    httpController.expectOne(BASE).flush({ data: [CLAIRE] });
    await settle(fixture);
    return { fixture, toasts: TestBed.inject(ToastStore) };
  }

  it.each([
    {
      write: 'deleting a message',
      method: 'DELETE',
      url: `${BASE}/1`,
      act: async (fixture: ComponentFixture<AdminMessages>): Promise<void> => {
        await pressTestId(fixture, 'message-delete', 0);
        await answerConfirmDialog(fixture, 'confirm');
      },
    },
    {
      write: 'marking a message as read',
      method: 'PATCH',
      url: `${BASE}/1/read`,
      act: (fixture: ComponentFixture<AdminMessages>): Promise<void> =>
        pressTestId(fixture, 'message-mark-read', 0),
    },
    {
      write: 'marking everything as read',
      method: 'PATCH',
      url: `${BASE}/mark-all-read`,
      act: (fixture: ComponentFixture<AdminMessages>): Promise<void> =>
        pressTestId(fixture, 'mark-all-read'),
    },
  ])(
    'Given the server fails while $write When the error comes back Then a single error toast is shown',
    async ({ method, url, act }) => {
      const { fixture, toasts } = await renderOverHttp();

      await act(fixture);
      httpController
        .expectOne({ method, url })
        .flush('down', { status: 500, statusText: 'Server Error' });
      await settle(fixture);

      expect(toasts.messages().filter((toast) => toast.severity === 'error').length).toBe(1);
    },
  );
});
