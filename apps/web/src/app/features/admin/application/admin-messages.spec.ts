import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminMessages } from './admin-messages';
import { ContactGateway, type ContactMessage } from '@features/contact/domain';
import { ToastStore } from '@shared/ui';

const msg = (p: Partial<ContactMessage> = {}): ContactMessage => ({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  subject: 'Bonjour',
  message: 'Un message',
  createdAt: '2026-01-01T10:00:00Z',
  read: false,
  ...p,
});

function makeGateway(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return {
    submitContactForm: () => of({ success: true, message: '' }),
    getAllMessages: () => of([]),
    markMessageAsRead: () => of(msg({ read: true })),
    deleteMessage: () => of(undefined),
    getUnreadCount: () => of(0),
    invalidateUnreadCount: () => undefined,
    ...overrides,
  } as ContactGateway;
}

type Internals = {
  messages: () => readonly ContactMessage[];
  expandedIds: () => ReadonlySet<string | number>;
  toggleExpand: (m: ContactMessage) => void;
  deleteMessage: (m: ContactMessage) => void;
  extraActions: readonly { handler: (m: ContactMessage) => void }[];
};

async function setup(gateway: ContactGateway = makeGateway()) {
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
    const { cmp } = await setup(makeGateway({ getAllMessages: () => of([msg({ id: 1 }), msg({ id: 2 })]) }));
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
});
