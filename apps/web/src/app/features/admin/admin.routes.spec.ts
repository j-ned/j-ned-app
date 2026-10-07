import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { ADMIN_ROUTES } from './admin.routes';
import { AdminOverview } from './application/admin-overview';

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
      blog: 'Articles | Admin',
      cv: 'CV | Admin',
      messages: 'Messages | Admin',
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
});

describe("ADMIN_ROUTES: vue d'ensemble", () => {
  it('Given the admin root When its page is loaded Then it is the overview', async () => {
    const root = ADMIN_ROUTES[0]?.children?.find((route) => route.path === '');

    expect(await root?.loadComponent?.()).toBe(AdminOverview);
  });
});
