import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

const ABOUT_TITLE = 'Parcours | Julien Nédellec';
const ABOUT_URL = `${SITE_IDENTITY.siteUrl}/about`;

const aboutRoute = (): Route | undefined => routes.find((route) => route.path === 'about');
const aboutSeo = (): Readonly<Record<string, unknown>> | undefined => aboutRoute()?.data?.['seo'];

describe('about route', () => {
  it('titles the page Parcours, in the tab and in the SEO data', () => {
    expect(aboutRoute()?.title).toBe(ABOUT_TITLE);
    expect(aboutSeo()?.['title']).toBe(ABOUT_TITLE);
    expect(aboutSeo()?.['url']).toBe(ABOUT_URL);
  });

  it('places Parcours under the home page in the breadcrumb', () => {
    expect(aboutSeo()?.['structuredData']).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Parcours', item: ABOUT_URL },
      ],
    });
  });
});
