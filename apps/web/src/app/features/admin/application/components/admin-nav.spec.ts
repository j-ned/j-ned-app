import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminNav } from './admin-nav';
import { adminNavGroups, type AdminNavCounts } from '../admin-nav-groups';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';

@Component({ template: '' })
class BlankPage {}

const COUNTS: AdminNavCounts = { projects: 6, posts: 2, unread: 3 };

const NAV_KEYS = [
  'overview',
  'projects',
  'posts',
  'profile',
  'insert-guide',
  'cv',
  'audience',
  'messages',
  'settings',
] as const;

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

type Rendered = {
  readonly fixture: ComponentFixture<AdminNav>;
  readonly host: HTMLElement;
  readonly emitted: { navigate: number; themeToggle: number; logout: number };
};

async function renderNav(
  options: {
    readonly url?: string;
    readonly counts?: AdminNavCounts;
    readonly isDark?: boolean;
    readonly email?: string;
  } = {},
): Promise<Rendered> {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', component: BlankPage }])],
  });
  const fixture = TestBed.createComponent(AdminNav);
  fixture.componentRef.setInput('groups', adminNavGroups(options.counts ?? COUNTS));
  fixture.componentRef.setInput('isDark', options.isDark ?? false);
  if (options.email !== undefined) fixture.componentRef.setInput('email', options.email);
  const emitted = { navigate: 0, themeToggle: 0, logout: 0 };
  fixture.componentInstance.navigate.subscribe(() => emitted.navigate++);
  fixture.componentInstance.themeToggle.subscribe(() => emitted.themeToggle++);
  fixture.componentInstance.logout.subscribe(() => emitted.logout++);
  await TestBed.inject(Router).navigateByUrl(options.url ?? '/admin');
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, emitted };
}

describe('AdminNav: page courante', () => {
  it.each([
    { url: '/admin', current: 'overview' },
    { url: '/admin/projects', current: 'projects' },
    { url: '/admin/blog', current: 'posts' },
    { url: '/admin/profile', current: 'profile' },
    { url: '/admin/guide-plaquettes', current: 'insert-guide' },
    { url: '/admin/audience', current: 'audience' },
    { url: '/admin/messages', current: 'messages' },
    { url: '/admin/settings/security', current: 'settings' },
  ])(
    'Given the page $url When the navigation renders Then only the $current link is the current page',
    async ({ url, current }) => {
      const { host } = await renderNav({ url });

      expect(
        Object.fromEntries(
          NAV_KEYS.map((key) => [
            key,
            byTestId(host, `nav-link-${key}`)?.getAttribute('aria-current') ?? null,
          ]),
        ),
      ).toEqual({
        ...Object.fromEntries(NAV_KEYS.map((key) => [key, null])),
        [current]: 'page',
      });
    },
  );

  it('Given the overview is current When the user moves to the messages Then the current page follows the route', async () => {
    const { fixture, host } = await renderNav({ url: '/admin' });

    await TestBed.inject(Router).navigateByUrl('/admin/messages');
    await settle(fixture);

    expect({
      overview: byTestId(host, 'nav-link-overview')?.getAttribute('aria-current') ?? null,
      messages: byTestId(host, 'nav-link-messages')?.getAttribute('aria-current') ?? null,
    }).toEqual({ overview: null, messages: 'page' });
  });
});

describe('AdminNav: comptes', () => {
  it('Given counts When the navigation renders Then projects, articles and unread messages show their number, the last spoken with its noun', async () => {
    const { host } = await renderNav();
    const unread = byTestId(host, 'nav-count-messages');

    expect({
      present: NAV_KEYS.filter((key) => byTestId(host, `nav-count-${key}`) !== null),
      projects: normalized(byTestId(host, 'nav-count-projects')),
      posts: normalized(byTestId(host, 'nav-count-posts')),
      messages: normalized(unread),
      spokenOnly: normalized(unread?.querySelector('.sr-only')),
      insideLink: byTestId(host, 'nav-link-messages')?.contains(unread) ?? false,
    }).toEqual({
      present: ['projects', 'posts', 'messages'],
      projects: '6',
      posts: '2',
      messages: '3 non lus',
      spokenOnly: 'non lus',
      insideLink: true,
    });
  });

  it('Given unknown counts When the navigation renders Then no count is shown', async () => {
    const { host } = await renderNav({
      counts: { projects: null, posts: null, unread: null },
    });

    expect(NAV_KEYS.filter((key) => byTestId(host, `nav-count-${key}`) !== null)).toEqual([]);
  });
});

describe('AdminNav: pied de navigation', () => {
  it('Given the footer When it renders Then « Voir le site » opens the public site in a new tab and says so', async () => {
    const { host } = await renderNav();
    const viewSite = byTestId(host, 'admin-view-site');

    expect({
      tag: viewSite?.tagName,
      href: viewSite?.getAttribute('href'),
      target: viewSite?.getAttribute('target'),
      rel: (viewSite?.getAttribute('rel') ?? '').split(' ').includes('noopener'),
      text: normalized(viewSite),
      spoken: normalized(viewSite?.querySelector('.sr-only')),
    }).toEqual({
      tag: 'A',
      href: '/',
      target: '_blank',
      rel: true,
      text: 'Voir le site (nouvel onglet)',
      spoken: '(nouvel onglet)',
    });
  });
});

describe('AdminNav: actions', () => {
  it('Given the navigation When a page link is followed Then navigate is emitted once and nothing else', async () => {
    const { fixture, host, emitted } = await renderNav();

    byTestId(host, 'nav-link-projects')?.click();
    await settle(fixture);

    expect({ emitted: { ...emitted }, url: TestBed.inject(Router).url }).toEqual({
      emitted: { navigate: 1, themeToggle: 0, logout: 0 },
      url: '/admin/projects',
    });
  });

  it.each([
    { testId: 'admin-theme-toggle', expected: { navigate: 0, themeToggle: 1, logout: 0 } },
    { testId: 'admin-logout', expected: { navigate: 0, themeToggle: 0, logout: 1 } },
  ])(
    'Given the navigation When $testId is pressed Then only its output is emitted',
    async ({ testId, expected }) => {
      const { fixture, host, emitted } = await renderNav();

      byTestId(host, testId)?.click();
      await settle(fixture);

      expect({ ...emitted }).toEqual(expected);
    },
  );
});
