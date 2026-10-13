import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { ADMIN_ROUTES } from './admin.routes';
import { AdminAudience } from './pages/admin-audience/admin-audience';
import { AdminAvailability } from './pages/admin-availability/admin-availability';
import { AdminBookings } from './pages/admin-bookings/admin-bookings';
import { AdminOverview } from './pages/admin-overview/admin-overview';
import { AdminPostEditor } from './pages/admin-post-editor/admin-post-editor';
import { AdminProfile } from './pages/admin-profile/admin-profile';
import { AdminProjectEditor } from './pages/admin-project-editor/admin-project-editor';
import { unsavedChangesGuard } from './application/unsaved-changes-guard';

describe('ADMIN_ROUTES: titres des pages', () => {
  it('Given the admin pages When their titles are read Then they are in French', () => {
    const pages = ADMIN_ROUTES[0]?.children ?? [];

    expect(
      Object.fromEntries(
        pages
          .filter((route) => typeof route.title === 'string')
          .map((route) => [route.path, route.title]),
      ),
    ).toEqual({
      '': "Vue d'ensemble | Admin",
      projects: 'Projets | Admin',
      'projects/new': 'Nouveau projet | Admin',
      'projects/:id': 'Modifier un projet | Admin',
      blog: 'Articles | Admin',
      'blog/new': 'Nouvel article | Admin',
      'blog/:id': 'Modifier un article | Admin',
      profile: 'Parcours | Admin',
      cv: 'CV | Admin',
      messages: 'Messages | Admin',
      'rendez-vous': 'Rendez-vous | Admin',
      disponibilites: 'Disponibilités | Admin',
      audience: 'Audience | Admin',
      settings: 'Paramètres | Admin',
      'settings/security': 'Sécurité | Admin',
    });
  });
});

async function navigate(url: string): Promise<{ url: string; title: string }> {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'admin', children: ADMIN_ROUTES }])],
  });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  return { url: router.url, title: TestBed.inject(Title).getTitle() };
}

describe('ADMIN_ROUTES: Audience', () => {
  it.each([
    '/admin/audience',
    '/admin/analytics',
    '/admin/analytics/visits',
    '/admin/analytics/projects',
    '/admin/stats',
  ])(
    'Given the address %s When it is opened Then the Audience page is served at /admin/audience',
    async (url) => {
      expect(await navigate(url)).toEqual({ url: '/admin/audience', title: 'Audience | Admin' });
    },
  );

  it('Given /admin/audience When its page is loaded Then it is the Audience page', async () => {
    const audience = ADMIN_ROUTES[0]?.children?.find((route) => route.path === 'audience');

    expect(await audience?.loadComponent?.()).toBe(AdminAudience);
  });
});

describe('ADMIN_ROUTES: Rendez-vous', () => {
  it('Given /admin/rendez-vous When it is opened Then it answers at that address with its title', async () => {
    expect(await navigate('/admin/rendez-vous')).toEqual({
      url: '/admin/rendez-vous',
      title: 'Rendez-vous | Admin',
    });
  });

  it('Given /admin/rendez-vous When its page is loaded Then it is the bookings page', async () => {
    const bookings = ADMIN_ROUTES[0]?.children?.find((route) => route.path === 'rendez-vous');

    expect({
      page: await bookings?.loadComponent?.(),
      guarded: bookings?.canDeactivate ?? null,
    }).toEqual({ page: AdminBookings, guarded: null });
  });
});

describe('ADMIN_ROUTES: Disponibilités', () => {
  it('Given /admin/disponibilites When it is opened Then it answers at that address with its title', async () => {
    expect(await navigate('/admin/disponibilites')).toEqual({
      url: '/admin/disponibilites',
      title: 'Disponibilités | Admin',
    });
  });

  it('Given /admin/disponibilites When its page is loaded Then it is the availability page, guarded against unsaved changes', async () => {
    const availability = ADMIN_ROUTES[0]?.children?.find(
      (route) => route.path === 'disponibilites',
    );

    expect({
      page: await availability?.loadComponent?.(),
      guarded: availability?.canDeactivate ?? null,
    }).toEqual({ page: AdminAvailability, guarded: [unsavedChangesGuard] });
  });
});

describe("ADMIN_ROUTES: vue d'ensemble", () => {
  it('Given the admin root When its page is loaded Then it is the overview', async () => {
    const root = ADMIN_ROUTES[0]?.children?.find((route) => route.path === '');

    expect(await root?.loadComponent?.()).toBe(AdminOverview);
  });
});

async function open(url: string): Promise<{
  url: string;
  title: string;
  path: string | undefined;
  id: string | null;
}> {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'admin', children: ADMIN_ROUTES }])],
  });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  let route = router.routerState.snapshot.root;
  while (route.firstChild) route = route.firstChild;
  return {
    url: router.url,
    title: TestBed.inject(Title).getTitle(),
    path: route.routeConfig?.path,
    id: route.paramMap.get('id'),
  };
}

describe('ADMIN_ROUTES: édition des projets', () => {
  it.each([
    {
      url: '/admin/projects/new',
      title: 'Nouveau projet | Admin',
      path: 'projects/new',
      id: null,
    },
    {
      url: '/admin/projects/p-1',
      title: 'Modifier un projet | Admin',
      path: 'projects/:id',
      id: 'p-1',
    },
    { url: '/admin/projects', title: 'Projets | Admin', path: 'projects', id: null },
  ])(
    'Given the address $url When it is opened Then the route $path answers with the title « $title »',
    async ({ url, title, path, id }) => {
      expect(await open(url)).toEqual({ url, title, path, id });
    },
  );

  it.each(['projects/new', 'projects/:id'])(
    'Given the route %s When its page is loaded Then it is the project editor',
    async (path) => {
      const route = ADMIN_ROUTES[0]?.children?.find((candidate) => candidate.path === path);

      expect(await route?.loadComponent?.()).toBe(AdminProjectEditor);
    },
  );

  it.each(['projects/new', 'projects/:id'])(
    'Given the route %s When the admin leaves it Then the unsaved changes guard is asked first',
    (path) => {
      const route = ADMIN_ROUTES[0]?.children?.find((candidate) => candidate.path === path);

      expect(route?.canDeactivate).toEqual([unsavedChangesGuard]);
    },
  );
});

describe('ADMIN_ROUTES: édition des articles', () => {
  it.each([
    { url: '/admin/blog/new', title: 'Nouvel article | Admin', path: 'blog/new', id: null },
    { url: '/admin/blog/b-1', title: 'Modifier un article | Admin', path: 'blog/:id', id: 'b-1' },
    { url: '/admin/blog', title: 'Articles | Admin', path: 'blog', id: null },
  ])(
    'Given the address $url When it is opened Then the route $path answers with the title « $title »',
    async ({ url, title, path, id }) => {
      expect(await open(url)).toEqual({ url, title, path, id });
    },
  );

  it.each(['blog/new', 'blog/:id'])(
    'Given the route %s When its page is loaded Then it is the article editor',
    async (path) => {
      const route = ADMIN_ROUTES[0]?.children?.find((candidate) => candidate.path === path);

      expect(await route?.loadComponent?.()).toBe(AdminPostEditor);
    },
  );

  it.each(['blog/new', 'blog/:id'])(
    'Given the route %s When the admin leaves it Then the unsaved changes guard is asked first',
    (path) => {
      const route = ADMIN_ROUTES[0]?.children?.find((candidate) => candidate.path === path);

      expect(route?.canDeactivate).toEqual([unsavedChangesGuard]);
    },
  );
});

describe('ADMIN_ROUTES: édition du parcours', () => {
  it.each(['/admin/profile', '/admin/about'])(
    'Given the address %s When it is opened Then the profile editor answers at /admin/profile',
    async (url) => {
      expect(await open(url)).toEqual({
        url: '/admin/profile',
        title: 'Parcours | Admin',
        path: 'profile',
        id: null,
      });
    },
  );

  it('Given the route profile When its page is loaded Then it is the profile editor', async () => {
    const route = ADMIN_ROUTES[0]?.children?.find((candidate) => candidate.path === 'profile');

    expect(await route?.loadComponent?.()).toBe(AdminProfile);
  });

  it('Given the route profile When the admin leaves it Then the unsaved changes guard is asked first', () => {
    const route = ADMIN_ROUTES[0]?.children?.find((candidate) => candidate.path === 'profile');

    expect(route?.canDeactivate).toEqual([unsavedChangesGuard]);
  });
});
