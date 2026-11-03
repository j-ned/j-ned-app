import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError, type Observable } from 'rxjs';
import { AdminLayout } from './admin-layout';
import { AuthStore } from '@core/auth/auth-store';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { makeUser } from '@features/auth/testing/user-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle } from '@shared/testing/settle';

@Component({ template: '' })
class BlankPage {}

type ShellSources = {
  readonly projects?: Observable<readonly Project[]>;
  readonly posts?: Observable<readonly BlogPost[]>;
  readonly unread?: Observable<number>;
};

type Shell = {
  readonly fixture: ComponentFixture<AdminLayout>;
  readonly host: HTMLElement;
  readonly logout: ReturnType<typeof vi.fn>;
  readonly crash: unknown;
};

const projectList = (size: number): readonly Project[] =>
  Array.from({ length: size }, (_, index) => makeProject({ id: `p-${index}` }));

const postList = (size: number): readonly BlogPost[] =>
  Array.from({ length: size }, (_, index) => makeBlogPost({ id: `a-${index}` }));

async function renderShell(url: string, sources: ShellSources = {}): Promise<Shell> {
  const logout = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: BlankPage }]),
      {
        provide: AuthStore,
        useValue: { currentUser: () => makeUser(), logout } as unknown as AuthStore,
      },
      {
        provide: ContactGateway,
        useValue: stubContactGateway({ getUnreadCount: () => sources.unread ?? of(0) }),
      },
      {
        provide: ProjectsGateway,
        useValue: {
          getAllProjects: (): Observable<readonly Project[]> =>
            sources.projects ?? of(projectList(0)),
        },
      },
      {
        provide: BlogGateway,
        useValue: {
          getAllPostsForAdmin: (): Observable<readonly BlogPost[]> =>
            sources.posts ?? of(postList(0)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AdminLayout);
  const crash = await captureCrash(async () => {
    await TestBed.inject(Router).navigateByUrl(url);
    await settle(fixture);
  });
  return { fixture, host: fixture.nativeElement as HTMLElement, logout, crash };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const drawerOf = (host: HTMLElement): HTMLElement | null =>
  host.querySelector<HTMLElement>('[role="dialog"]');

describe('AdminLayout: comptes de la navigation', () => {
  it('Given 6 projects, 2 articles and 3 unread messages When the shell renders Then the navigation shows these counts', async () => {
    const { host, crash } = await renderShell('/admin', {
      projects: of(projectList(6)),
      posts: of(postList(2)),
      unread: of(3),
    });

    expect({
      crash,
      projects: normalized(byTestId(host, 'nav-count-projects')),
      posts: normalized(byTestId(host, 'nav-count-posts')),
      messages: normalized(byTestId(host, 'nav-count-messages')),
    }).toEqual({ crash: null, projects: '6', posts: '2', messages: '3 non lus' });
  });

  it('Given a shared project list When the gateway pushes a new list Then the count follows without reload', async () => {
    const projects = new BehaviorSubject<readonly Project[]>(projectList(6));
    const { fixture, host } = await renderShell('/admin', { projects });
    const before = normalized(byTestId(host, 'nav-count-projects'));

    projects.next(projectList(5));
    await settle(fixture);

    expect({ before, after: normalized(byTestId(host, 'nav-count-projects')) }).toEqual({
      before: '6',
      after: '5',
    });
  });

  it.each([
    {
      source: 'projects',
      sources: { projects: throwError(() => new Error('down')) },
      absent: 'nav-count-projects',
    },
  ])(
    'Given the $source count fails When the shell renders Then that count is absent and the shell still renders',
    async ({ sources, absent }) => {
      const { host, crash } = await renderShell('/admin', sources);

      expect({
        crash,
        absent: byTestId(host, absent),
        overview: byTestId(host, 'nav-link-overview') !== null,
      }).toEqual({ crash: null, absent: null, overview: true });
    },
  );
});

describe('AdminLayout: barre mobile et tiroir', () => {
  it('Given the drawer closed When the menu button is pressed Then the drawer it controls opens with the navigation and the button says so', async () => {
    const { fixture, host } = await renderShell('/admin');
    const button = byTestId(host, 'admin-menu-button');
    const before = {
      expanded: button?.getAttribute('aria-expanded') ?? null,
      drawer: drawerOf(host) !== null,
    };

    await pressTestId(fixture, 'admin-menu-button');
    const controlled = document.getElementById(button?.getAttribute('aria-controls') ?? '');
    const drawer = drawerOf(host);

    expect({
      before,
      after: {
        expanded: button?.getAttribute('aria-expanded') ?? null,
        controlsDrawer:
          drawer !== null &&
          controlled !== null &&
          (controlled === drawer || controlled.contains(drawer)),
        navInDrawer: drawer?.querySelector('[data-testid="nav-link-projects"]') !== null,
      },
    }).toEqual({
      before: { expanded: 'false', drawer: false },
      after: { expanded: 'true', controlsDrawer: true, navInDrawer: true },
    });
  });

  it('Given the drawer open When a page link of the drawer is followed Then the page changes and the drawer closes', async () => {
    const { fixture, host } = await renderShell('/admin');
    await pressTestId(fixture, 'admin-menu-button');

    drawerOf(host)?.querySelector<HTMLElement>('[data-testid="nav-link-messages"]')?.click();
    await settle(fixture);

    expect({
      url: TestBed.inject(Router).url,
      drawer: drawerOf(host) !== null,
      expanded: byTestId(host, 'admin-menu-button')?.getAttribute('aria-expanded') ?? null,
    }).toEqual({ url: '/admin/messages', drawer: false, expanded: 'false' });
  });

  it('Given the drawer open When logout is pressed in the drawer Then the session ends and the drawer closes', async () => {
    const { fixture, host, logout } = await renderShell('/admin');
    await pressTestId(fixture, 'admin-menu-button');

    drawerOf(host)?.querySelector<HTMLElement>('[data-testid="admin-logout"]')?.click();
    await settle(fixture);

    expect({ logout: logout.mock.calls.length, drawer: drawerOf(host) !== null }).toEqual({
      logout: 1,
      drawer: false,
    });
  });
});

describe('AdminLayout: pied de la barre latérale', () => {
  it('Given a signed-in user When the shell renders Then the sidebar logs out on demand', async () => {
    const { fixture, logout } = await renderShell('/admin');

    await pressTestId(fixture, 'admin-logout');

    expect(logout).toHaveBeenCalledTimes(1);
  });
});

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
    const { fixture, host } = await renderShell('/admin');
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
