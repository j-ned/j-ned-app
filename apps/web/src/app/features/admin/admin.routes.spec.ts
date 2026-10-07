import { ADMIN_ROUTES } from './admin.routes';

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
      analytics: 'Audience | Admin',
      settings: 'Paramètres | Admin',
      'settings/security': 'Sécurité | Admin',
    });
  });
});
