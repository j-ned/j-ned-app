import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

const PROJECTS_TITLE = 'Réalisations Angular et NestJS en production | Julien Nédellec';
const PROJECTS_URL = `${SITE_IDENTITY.siteUrl}/projects`;

const projectsRoute = (): Route | undefined => routes.find((route) => route.path === 'projects');
const projectsSeo = (): Readonly<Record<string, unknown>> | undefined =>
  projectsRoute()?.data?.['seo'];

describe('projects route', () => {
  it('titles the page with its intent, in the tab and in the SEO data, at the unchanged url', () => {
    expect(projectsRoute()?.title).toBe(PROJECTS_TITLE);
    expect(projectsSeo()?.['title']).toBe(PROJECTS_TITLE);
    expect(projectsSeo()?.['url']).toBe(PROJECTS_URL);
  });

  it('describes the page with the validated snippet', () => {
    expect(projectsSeo()?.['description']).toBe(
      'Applications Angular et NestJS en production, sites de démonstration et scripts\u00a0: le besoin réglé et les choix techniques de chaque projet.',
    );
  });

  it('places Réalisations under the home page in the breadcrumb', () => {
    expect(projectsSeo()?.['structuredData']).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Réalisations', item: PROJECTS_URL },
      ],
    });
  });
});
