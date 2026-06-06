import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminDashboard } from './admin-dashboard';
import { ContactGateway, type ContactMessage } from '@features/contact/domain';
import { AnalyticsGateway } from '@features/analytics/domain';
import { AuthStore } from '@core/auth/auth-store';

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

function makeContactGateway(overrides: Partial<ContactGateway> = {}): ContactGateway {
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

function makeAnalytics(cvCount = 0): AnalyticsGateway {
  return { getCvDownloadCount: () => of(cvCount) } as unknown as AnalyticsGateway;
}

const authStub = { currentUser: () => null } as unknown as AuthStore;

type Internals = {
  unreadCount: () => number;
  latestMessages: () => readonly ContactMessage[];
  cvDownloadCount: () => number;
};

async function setup(contact: ContactGateway, analytics: AnalyticsGateway = makeAnalytics()) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ContactGateway, useValue: contact },
      { provide: AnalyticsGateway, useValue: analytics },
      { provide: AuthStore, useValue: authStub },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminDashboard);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.componentInstance as unknown as Internals;
}

describe('AdminDashboard', () => {
  it('expose le nombre de messages non lus du gateway', async () => {
    const cmp = await setup(makeContactGateway({ getUnreadCount: () => of(5) }));
    expect(cmp.unreadCount()).toBe(5);
  });

  it('latestMessages garde les 3 plus récents triés par date décroissante', async () => {
    const cmp = await setup(
      makeContactGateway({
        getAllMessages: () =>
          of([
            msg({ id: 1, createdAt: '2026-01-01T10:00:00Z' }),
            msg({ id: 2, createdAt: '2026-03-01T10:00:00Z' }),
            msg({ id: 3, createdAt: '2026-02-01T10:00:00Z' }),
            msg({ id: 4, createdAt: '2026-04-01T10:00:00Z' }),
          ]),
      }),
    );
    expect(cmp.latestMessages().map((m) => m.id)).toEqual([4, 2, 3]);
  });

  it('expose le nombre de CV téléchargés du gateway analytics', async () => {
    const cmp = await setup(makeContactGateway(), makeAnalytics(42));
    expect(cmp.cvDownloadCount()).toBe(42);
  });
});
