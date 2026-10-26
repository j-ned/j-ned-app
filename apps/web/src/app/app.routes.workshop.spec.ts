import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type Route, Router, provideRouter } from '@angular/router';
import { Workshop } from '@features/workshop/pages/workshop/workshop';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';
import { ROUTE_TEXTS } from './testing/editorial-sources';

const WORKSHOP_TITLE = "L'atelier : outils de tourneur CN | Julien Nédellec";
const WORKSHOP_URL = `${SITE_IDENTITY.siteUrl}/atelier`;

const workshopRoute = (): Route | undefined => routes.find((route) => route.path === 'atelier');

const leafOf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leafOf(snapshot.firstChild) : snapshot;

describe('workshop route', () => {
  it('Given the workshop url When navigated to Then the workshop page answers, not the not-found page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/atelier');
    const leaf = leafOf(router.routerState.snapshot.root);

    expect([router.url, leaf.routeConfig?.path, leaf.component]).toEqual([
      '/atelier',
      'atelier',
      Workshop,
    ]);
  });

  it('loads the page on demand, as a top-level route', async () => {
    const route = workshopRoute();

    expect(route?.component).toBeUndefined();
    expect(route?.loadChildren).toBeUndefined();
    expect(await route?.loadComponent?.()).toBe(Workshop);
  });

  it('titles the page in the tab with the validated title', () => {
    expect(workshopRoute()?.title).toBe(WORKSHOP_TITLE);
  });

  it('preloads the page and gives it the validated SEO data, canonical url and breadcrumb', () => {
    expect(workshopRoute()?.data).toEqual({
      preload: true,
      seo: {
        title: WORKSHOP_TITLE,
        description:
          "Mon coin de tourneur CN : des outils d'usinage, à commencer par un guide pour choisir le type de plaquette selon la matière et l'opération.",
        url: WORKSHOP_URL,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            { '@type': 'ListItem', position: 2, name: "L'atelier", item: WORKSHOP_URL },
          ],
        },
      },
    });
  });

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(workshopRoute()?.data?.['seo']?.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('hands its title and SEO data to the editorial locks', () => {
    expect(ROUTE_TEXTS['/atelier']).toEqual({
      title: WORKSHOP_TITLE,
      seo: workshopRoute()?.data?.['seo'],
    });
  });
});
