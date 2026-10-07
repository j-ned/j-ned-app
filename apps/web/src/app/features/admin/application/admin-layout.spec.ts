import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminLayout } from './admin-layout';
import { AuthStore } from '@core/auth/auth-store';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import {
  byTestId,
  captureCrash,
  pressTestId,
  settle,
  testIdText,
} from '@shared/testing/press-test-id';

const authStub = { currentUser: () => null, logout: () => undefined } as unknown as AuthStore;

async function renderShell(
  getUnreadCount: ContactGateway['getUnreadCount'],
): Promise<{ host: HTMLElement; crash: unknown }> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthStore, useValue: authStub },
      { provide: ContactGateway, useValue: stubContactGateway({ getUnreadCount }) },
    ],
  });
  const fixture = TestBed.createComponent(AdminLayout);
  const crash = await captureCrash(() => settle(fixture));
  return { host: fixture.nativeElement as HTMLElement, crash };
}

const unreadBadges = (host: HTMLElement): readonly string[] =>
  [...host.querySelectorAll('[data-testid="nav-unread-count"]')].map((badge) =>
    (badge.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, ''),
  );

describe('AdminLayout: pastille des messages non lus', () => {
  it.each([
    { unread: 'three unread', stream: of(3), badge: /^3( |$)/ },
    { unread: 'no unread', stream: of(0), badge: null },
    { unread: 'a failed count', stream: throwError(() => new Error('down')), badge: null },
  ])(
    'Given $unread When the shell renders Then the badge is shown only for a positive count',
    async ({ stream, badge }) => {
      const { host, crash } = await renderShell(() => stream);
      const badges = unreadBadges(host);

      expect({
        crash,
        badges: badges.length,
        text: badges[0] ?? null,
      }).toEqual({
        crash: null,
        badges: badge === null ? 0 : 1,
        text: badge === null ? null : expect.stringMatching(badge),
      });
    },
  );
});

@Component({ template: '' })
class BlankPage {}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

async function renderShellAt(
  url: string,
  unread: number,
): Promise<{ fixture: ComponentFixture<AdminLayout>; host: HTMLElement }> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: BlankPage }]),
      { provide: AuthStore, useValue: authStub },
      {
        provide: ContactGateway,
        useValue: stubContactGateway({ getUnreadCount: () => of(unread) }),
      },
    ],
  });
  const fixture = TestBed.createComponent(AdminLayout);
  await TestBed.inject(Router).navigateByUrl(url);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const navLinks = (host: HTMLElement): readonly HTMLAnchorElement[] => [
  ...host.querySelectorAll<HTMLAnchorElement>('a[href^="/admin"]'),
];

describe('AdminLayout: bascule de thème', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  it('Given a stored dark preference When the admin theme toggle is pressed Then the page leaves the dark register, the choice is stored and the toggle offers the way back', async () => {
    localStorage.setItem('j-ned:theme', 'dark');
    const { fixture, host } = await renderShellAt('/admin', 0);
    TestBed.tick();
    const before = {
      label: testIdText(host, 'admin-theme-toggle'),
      htmlDark: document.documentElement.classList.contains('app-dark'),
    };

    await pressTestId(fixture, 'admin-theme-toggle');
    TestBed.tick();
    await settle(fixture);

    expect({
      before,
      after: {
        label: testIdText(host, 'admin-theme-toggle'),
        htmlDark: document.documentElement.classList.contains('app-dark'),
        stored: localStorage.getItem('j-ned:theme'),
      },
    }).toEqual({
      before: { label: 'Passer en mode clair', htmlDark: true },
      after: { label: 'Passer en mode sombre', htmlDark: false, stored: 'light' },
    });
  });
});

describe('AdminLayout: navigation en français', () => {
  it('Given the shell When it renders Then each admin destination carries its French label', async () => {
    const { host } = await renderShellAt('/admin', 0);

    expect(
      Object.fromEntries(
        navLinks(host).map((link) => [link.getAttribute('href'), normalized(link)]),
      ),
    ).toEqual({
      '/admin': "Vue d'ensemble",
      '/admin/projects': 'Projets',
      '/admin/blog': 'Articles',
      '/admin/cv': 'CV',
      '/admin/messages': 'Messages',
      '/admin/analytics': 'Audience',
      '/admin/settings': 'Paramètres',
    });
  });
});

describe('AdminLayout: page courante et non-lus annoncés', () => {
  it('Given the messages page When the shell renders Then only its link is marked as the current page', async () => {
    const { host } = await renderShellAt('/admin/messages', 0);

    expect(
      Object.fromEntries(
        navLinks(host).map((link) => [
          link.getAttribute('href'),
          link.getAttribute('aria-current'),
        ]),
      ),
    ).toEqual({
      '/admin': null,
      '/admin/projects': null,
      '/admin/blog': null,
      '/admin/cv': null,
      '/admin/messages': 'page',
      '/admin/analytics': null,
      '/admin/settings': null,
    });
  });

  it.each([
    { unread: 3, spoken: '3 non lus' },
    { unread: 1, spoken: '1 non lu' },
  ])(
    'Given $unread unread message(s) When the shell renders Then the badge reads « $spoken »',
    async ({ unread, spoken }) => {
      const { host } = await renderShellAt('/admin', unread);
      const badge = byTestId(host, 'nav-unread-count');

      expect({
        spoken: normalized(badge),
        hidden: normalized(badge?.querySelector('.sr-only')),
      }).toEqual({ spoken, hidden: spoken.replace(/^\d+ /, '') });
    },
  );
});
