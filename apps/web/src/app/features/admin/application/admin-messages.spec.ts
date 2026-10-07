import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { AdminMessages } from './admin-messages';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { ToastStore } from '@shared/ui/toast-store';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '@shared/api/api-config';
import { HttpContactGateway } from '@features/contact/infra/gateways/http-contact.gateway';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import {
  byTestId,
  captureCrash,
  pressTestId,
  settle,
  settleBounded,
} from '@shared/testing/press-test-id';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

const msg = makeContactMessage;

function makeGateway(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return stubContactGateway({ markMessageAsRead: () => of(msg({ read: true })), ...overrides });
}

type Internals = {
  messages: () => readonly ContactMessage[];
  expandedIds: () => ReadonlySet<string | number>;
  toggleExpand: (m: ContactMessage) => void;
  deleteMessage: (m: ContactMessage) => void;
  extraActions: readonly { handler: (m: ContactMessage) => void }[];
  markAllRead: () => void;
  hasUnread: () => boolean;
  readFilter: { set: (v: boolean | 'all') => void };
};

async function setup(gateway: ContactGateway = makeGateway()): Promise<{
  fixture: ComponentFixture<AdminMessages>;
  cmp: Internals;
  toast: { add: ReturnType<typeof vi.fn> };
}> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: ContactGateway, useValue: gateway },
      { provide: ToastStore, useValue: toast },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminMessages);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const cmp = fixture.componentInstance as unknown as Internals;
  return { fixture, cmp, toast };
}

describe('AdminMessages', () => {
  it('charge les messages depuis le gateway', async () => {
    const { cmp } = await setup(
      makeGateway({ getAllMessages: () => of([msg({ id: 1 }), msg({ id: 2 })]) }),
    );
    expect(cmp.messages().map((m) => m.id)).toEqual([1, 2]);
  });

  it('toggleExpand ajoute puis retire l’id de la ligne', async () => {
    const { cmp } = await setup();
    const m = msg({ id: 7 });
    cmp.toggleExpand(m);
    expect(cmp.expandedIds().has(7)).toBe(true);
    cmp.toggleExpand(m);
    expect(cmp.expandedIds().has(7)).toBe(false);
  });

  describe('markAsRead (action « Marquer comme lu »)', () => {
    it('remplace le message, invalide le compteur non-lus et notifie le succès', async () => {
      const invalidate = vi.fn();
      const { cmp, toast } = await setup(
        makeGateway({
          getAllMessages: () => of([msg({ id: 1, read: false })]),
          markMessageAsRead: () => of(msg({ id: 1, read: true })),
          invalidateUnreadCount: invalidate,
        }),
      );
      cmp.extraActions[0].handler(msg({ id: 1, read: false }));
      expect(cmp.messages().find((m) => m.id === 1)?.read).toBe(true);
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur si la mise à jour échoue', async () => {
      const { cmp, toast } = await setup(
        makeGateway({
          getAllMessages: () => of([msg({ id: 1 })]),
          markMessageAsRead: () => throwError(() => new Error('boom')),
        }),
      );
      cmp.extraActions[0].handler(msg({ id: 1 }));
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('deleteMessage', () => {
    it('retire le message de façon optimiste et notifie le succès', async () => {
      const invalidate = vi.fn();
      const { cmp, toast } = await setup(
        makeGateway({
          getAllMessages: () => of([msg({ id: 1 }), msg({ id: 2 })]),
          deleteMessage: () => of(undefined),
          invalidateUnreadCount: invalidate,
        }),
      );
      cmp.deleteMessage(msg({ id: 1 }));
      expect(cmp.messages().map((m) => m.id)).toEqual([2]);
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { cmp, toast } = await setup(
        makeGateway({
          getAllMessages: () => of([msg({ id: 1 }), msg({ id: 2 })]),
          deleteMessage: () => throwError(() => new Error('boom')),
        }),
      );
      cmp.deleteMessage(msg({ id: 1 }));
      expect(cmp.messages().map((m) => m.id)).toEqual([1, 2]);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('markAllRead (action « Tout marquer comme lu »)', () => {
    it('passe tous les messages à read=true (optimiste), invalide le compteur et notifie le succès', async () => {
      const invalidate = vi.fn();
      const { cmp, toast } = await setup(
        makeGateway({
          getAllMessages: () => of([msg({ id: 1, read: false }), msg({ id: 2, read: false })]),
          markAllRead: () => of({ count: 2 }),
          invalidateUnreadCount: invalidate,
        }),
      );
      cmp.markAllRead();
      expect(cmp.messages().every((m) => m.read)).toBe(true);
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la mise à jour échoue', async () => {
      const { cmp, toast } = await setup(
        makeGateway({
          getAllMessages: () => of([msg({ id: 1, read: false }), msg({ id: 2, read: true })]),
          markAllRead: () => throwError(() => new Error('boom')),
        }),
      );
      cmp.markAllRead();
      expect(cmp.messages().map((m) => m.read)).toEqual([false, true]);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('hasUnread est false quand tous les messages sont lus', async () => {
      const { cmp } = await setup(
        makeGateway({ getAllMessages: () => of([msg({ id: 1, read: true })]) }),
      );
      expect(cmp.hasUnread()).toBe(false);
    });
  });

  describe('filtre par statut de lecture', () => {
    const seed = (): ContactGateway =>
      makeGateway({
        getAllMessages: () => of([msg({ id: 1, read: false }), msg({ id: 2, read: true })]),
      });

    it('par défaut (all) affiche tous les messages', async () => {
      const { cmp } = await setup(seed());
      expect(cmp.messages().map((m) => m.id)).toEqual([1, 2]);
    });

    it('readFilter=false ne garde que les non-lus', async () => {
      const { cmp, fixture } = await setup(seed());
      cmp.readFilter.set(false);
      fixture.detectChanges();
      expect(cmp.messages().map((m) => m.id)).toEqual([1]);
    });

    it('readFilter=true ne garde que les lus', async () => {
      const { cmp, fixture } = await setup(seed());
      cmp.readFilter.set(true);
      fixture.detectChanges();
      expect(cmp.messages().map((m) => m.id)).toEqual([2]);
    });
  });
});

describe('AdminMessages: suppression confirmée', () => {
  const CLAIRE = makeContactMessage({
    id: 1,
    name: 'Claire Martin',
    createdAt: '2026-10-06T10:00:00Z',
  });
  const PAUL = makeContactMessage({
    id: 2,
    name: 'Paul Durand',
    createdAt: '2026-10-01T10:00:00Z',
  });

  async function renderList(): Promise<{
    fixture: ComponentFixture<AdminMessages>;
    host: HTMLElement;
    cmp: Internals;
    deleteMessage: ReturnType<typeof vi.fn>;
  }> {
    const deleteMessage = vi.fn((): Observable<void> => of(undefined));
    const { fixture, cmp } = await setup(
      makeGateway({ getAllMessages: () => of([CLAIRE, PAUL]), deleteMessage }),
    );
    await settle(fixture);
    return { fixture, host: fixture.nativeElement as HTMLElement, cmp, deleteMessage };
  }

  it('Given the inbox When the trash of the message from Claire Martin is pressed Then the dialog asks to confirm and nothing is deleted yet', async () => {
    const { fixture, host, cmp, deleteMessage } = await renderList();

    await pressTestId(fixture, 'message-delete', 0);

    expect({
      dialog: readConfirmDialog(host),
      deleteCalls: deleteMessage.mock.calls.length,
      messages: cmp.messages().map((message) => message.id),
    }).toEqual({
      dialog: expect.objectContaining({
        open: true,
        heading: 'Supprimer le message de Claire Martin\u202f?',
        confirm: 'Supprimer le message',
        cancel: 'Annuler',
      }),
      deleteCalls: 0,
      messages: [1, 2],
    });
  });

  it.each([
    { answer: 'confirm' as const, deleted: [[1]], messages: [2] },
    { answer: 'cancel' as const, deleted: [], messages: [1, 2] },
    { answer: 'escape' as const, deleted: [], messages: [1, 2] },
  ])(
    'Given the dialog asks about the message from Claire Martin When the user answers $answer Then the gateway deletes $deleted and the dialog closes',
    async ({ answer, deleted, messages }) => {
      const { fixture, host, cmp, deleteMessage } = await renderList();
      await pressTestId(fixture, 'message-delete', 0);

      await answerConfirmDialog(fixture, answer);

      expect({
        open: readConfirmDialog(host).open,
        deleted: deleteMessage.mock.calls,
        messages: cmp.messages().map((message) => message.id),
      }).toEqual({ open: false, deleted, messages });
    },
  );

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
  const STATE_TEST_IDS = [
    'admin-messages-loading',
    'load-error',
    'admin-messages-empty',
    'admin-messages-list',
  ] as const;

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
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminMessages);
    const crash = await captureCrash(() => settleBounded(fixture));
    return { fixture, host: fixture.nativeElement as HTMLElement, crash };
  }

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
    { state: 'loading', stream: NEVER, shown: 'admin-messages-loading' },
    {
      state: 'failed',
      stream: throwError(() => new Error('down')),
      shown: 'load-error',
    },
    { state: 'empty', stream: of([]), shown: 'admin-messages-empty' },
    { state: 'loaded', stream: of([makeContactMessage()]), shown: 'admin-messages-list' },
  ])(
    'Given the inbox is $state When the page renders Then only $shown is shown',
    async ({ stream, shown }) => {
      const { host, crash } = await renderWith(() => stream);

      expect({ crash, present: present(host) }).toEqual({ crash: null, present: [shown] });
    },
  );

  it('Given the inbox is loading Then the placeholder is announced as a status', async () => {
    const { host } = await renderWith(() => NEVER);

    expect(byTestId(host, 'admin-messages-loading')?.getAttribute('role')).toBe('status');
  });
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
      schemas: [NO_ERRORS_SCHEMA],
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

describe('AdminMessages: lecture au clavier et tri annoncé', () => {
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

  const normalized = (element: Element | null | undefined): string =>
    (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

  const nativeButton = (element: HTMLElement | null): HTMLButtonElement | null =>
    element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

  const accessibleName = (button: HTMLButtonElement | null): string =>
    button?.getAttribute('aria-label') ?? normalized(button);

  const allByTestId = (host: HTMLElement, testId: string): readonly HTMLElement[] => [
    ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
  ];

  async function renderInbox(): Promise<{
    fixture: ComponentFixture<AdminMessages>;
    host: HTMLElement;
    markMessageAsRead: ReturnType<typeof vi.fn>;
  }> {
    const markMessageAsRead = vi.fn(
      (): Observable<ContactMessage> => of({ ...CLAIRE, read: true }),
    );
    const { fixture } = await setup(
      makeGateway({ getAllMessages: () => of([CLAIRE, PAUL]), markMessageAsRead }),
    );
    await settle(fixture);
    return { fixture, host: fixture.nativeElement as HTMLElement, markMessageAsRead };
  }

  const expandButtons = (host: HTMLElement): readonly (HTMLButtonElement | null)[] =>
    allByTestId(host, 'message-expand').map(nativeButton);

  const sortHeader = (host: HTMLElement, key: string): HTMLTableCellElement | null =>
    byTestId(host, `sort-${key}`)?.closest('th') ?? null;

  it('Given the inbox When it renders Then each row offers a native button that names the sender and is collapsed', async () => {
    const { host } = await renderInbox();

    expect(
      expandButtons(host).map((button) => ({
        tag: button?.tagName,
        type: button?.getAttribute('type'),
        expanded: button?.getAttribute('aria-expanded'),
        name: normalized(button),
      })),
    ).toEqual([
      {
        tag: 'BUTTON',
        type: 'button',
        expanded: 'false',
        name: 'Afficher le message de Claire Martin',
      },
      {
        tag: 'BUTTON',
        type: 'button',
        expanded: 'false',
        name: 'Afficher le message de Paul Durand',
      },
    ]);
  });

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

  it('Given an open message When its button is pressed again Then the body is hidden and the button collapsed', async () => {
    const { fixture, host } = await renderInbox();
    await pressTestId(fixture, 'message-expand', 0);

    await pressTestId(fixture, 'message-expand', 0);

    expect({
      expanded: expandButtons(host)[0]?.getAttribute('aria-expanded'),
      bodies: allByTestId(host, 'message-body').length,
    }).toEqual({ expanded: 'false', bodies: 0 });
  });

  it('Given the inbox When it renders Then sortable headers stay column headers, each holding a sort button, and only the sorted one announces its order', async () => {
    const { host } = await renderInbox();

    expect({
      buttonHeaders: host.querySelectorAll('th[role="button"]').length,
      headers: ['name', 'subject', 'createdAt'].map((key) => {
        const button = byTestId(host, `sort-${key}`);
        const header = sortHeader(host, key);
        return {
          key,
          button: button?.tagName,
          type: button?.getAttribute('type'),
          scope: header?.getAttribute('scope'),
          sort: header?.getAttribute('aria-sort'),
        };
      }),
    }).toEqual({
      buttonHeaders: 0,
      headers: [
        { key: 'name', button: 'BUTTON', type: 'button', scope: 'col', sort: null },
        { key: 'subject', button: 'BUTTON', type: 'button', scope: 'col', sort: null },
        { key: 'createdAt', button: 'BUTTON', type: 'button', scope: 'col', sort: 'descending' },
      ],
    });
  });

  it('Given the inbox When the sender sort button is pressed twice Then its header announces ascending, then descending, and the date header no longer announces anything', async () => {
    const { fixture, host } = await renderInbox();

    await pressTestId(fixture, 'sort-name');
    const afterFirst = {
      name: sortHeader(host, 'name')?.getAttribute('aria-sort'),
      createdAt: sortHeader(host, 'createdAt')?.getAttribute('aria-sort'),
      expandNames: expandButtons(host).map(normalized),
    };
    await pressTestId(fixture, 'sort-name');

    expect({
      afterFirst,
      afterSecond: {
        name: sortHeader(host, 'name')?.getAttribute('aria-sort'),
        createdAt: sortHeader(host, 'createdAt')?.getAttribute('aria-sort'),
        expandNames: expandButtons(host).map(normalized),
      },
    }).toEqual({
      afterFirst: {
        name: 'ascending',
        createdAt: null,
        expandNames: ['Afficher le message de Claire Martin', 'Afficher le message de Paul Durand'],
      },
      afterSecond: {
        name: 'descending',
        createdAt: null,
        expandNames: ['Afficher le message de Paul Durand', 'Afficher le message de Claire Martin'],
      },
    });
  });

  it('Given the inbox When it renders Then each action names the message it acts on', async () => {
    const { host } = await renderInbox();

    expect({
      markRead: allByTestId(host, 'message-mark-read').map((el) =>
        accessibleName(nativeButton(el)),
      ),
      delete: allByTestId(host, 'message-delete').map((el) => accessibleName(nativeButton(el))),
    }).toEqual({
      markRead: ['Marquer comme lu\u00a0: Claire Martin'],
      delete: ['Supprimer le message de Claire Martin', 'Supprimer le message de Paul Durand'],
    });
  });

  it('Given an unread message When its mark-as-read action is pressed Then the gateway marks that message', async () => {
    const { fixture, markMessageAsRead } = await renderInbox();

    await pressTestId(fixture, 'message-mark-read', 0);

    expect(markMessageAsRead.mock.calls).toEqual([[1]]);
  });
});
