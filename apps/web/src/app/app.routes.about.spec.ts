import type { Route } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

const ABOUT_TITLE = 'Développeur full-stack Angular / NestJS, parcours et CV | Julien Nédellec';
const ABOUT_URL = `${SITE_IDENTITY.siteUrl}/about`;

const aboutRoute = (): Route | undefined => routes.find((route) => route.path === 'about');
const aboutSeo = (): Readonly<Record<string, unknown>> | undefined => aboutRoute()?.data?.['seo'];

describe('about route', () => {
  it('titles the page for a recruiter, in the tab and in the SEO data', () => {
    expect(aboutRoute()?.title).toBe(ABOUT_TITLE);
    expect(aboutSeo()?.['title']).toBe(ABOUT_TITLE);
    expect(aboutSeo()?.['url']).toBe(ABOUT_URL);
  });

  it('describes the page with the site-wide journey, then what the page holds', () => {
    expect(aboutSeo()?.['description']).toBe(`${SITE_IDENTITY.journey} Parcours, stack et CV.`);
  });

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(aboutSeo()?.['description'] ?? '');

    expect(description.length).toBeGreaterThan(SITE_IDENTITY.journey.length);
    expect(description.length).toBeLessThanOrEqual(160);
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
