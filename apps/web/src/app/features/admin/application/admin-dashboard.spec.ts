import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { AdminDashboard } from './admin-dashboard';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { AuthStore } from '@core/auth/auth-store';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { captureCrash, settle } from '@shared/testing/press-test-id';

const msg = makeContactMessage;

function makeContactGateway(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return stubContactGateway({ markMessageAsRead: () => of(msg({ read: true })), ...overrides });
}

function makeAnalytics(
  cvCount = 0,
  getCvDownloadCount: () => Observable<number> = () => of(cvCount),
): AnalyticsGateway {
  return { getCvDownloadCount } as unknown as AnalyticsGateway;
}

const authStub = { currentUser: () => null } as unknown as AuthStore;

type Internals = {
  unreadCount: () => number;
  latestMessages: () => readonly ContactMessage[];
  cvDownloadCount: () => number;
};

async function setup(
  contact: ContactGateway,
  analytics: AnalyticsGateway = makeAnalytics(),
): Promise<Internals> {
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

describe('AdminDashboard: compteurs indisponibles', () => {
  async function renderCounts(
    contact: ContactGateway,
    analytics: AnalyticsGateway,
  ): Promise<{ host: HTMLElement; crash: unknown }> {
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
    const crash = await captureCrash(() => settle(fixture));
    return { host: fixture.nativeElement as HTMLElement, crash };
  }

  const compact = (host: HTMLElement, testId: string): string =>
    (host.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '').replace(/[ \t\n\r]/g, '');

  const down = throwError(() => new Error('down'));

  it.each([
    { counts: 'both available', unread: of(5), cv: of(42), expected: ['5', '42'] },
    { counts: 'unread failed', unread: down, cv: of(42), expected: ['—indisponible', '42'] },
    { counts: 'cv failed', unread: of(5), cv: down, expected: ['5', '—indisponible'] },
    { counts: 'both failed', unread: down, cv: down, expected: ['—indisponible', '—indisponible'] },
  ])(
    'Given $counts When the dashboard renders Then the counters read $expected',
    async ({ unread, cv, expected }) => {
      const { host, crash } = await renderCounts(
        makeContactGateway({ getUnreadCount: () => unread }),
        makeAnalytics(0, () => cv),
      );

      expect({
        crash,
        counters: [compact(host, 'dashboard-unread-count'), compact(host, 'dashboard-cv-count')],
      }).toEqual({ crash: null, counters: expected });
    },
  );
});
