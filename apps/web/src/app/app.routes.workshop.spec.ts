import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type Route, Router, provideRouter } from '@angular/router';
import { WORKSHOP_SPACE } from '@features/workshop/domain/workshop-space.static-data';
import { InsertGuide } from '@features/workshop/pages/insert-guide/insert-guide';
import { Workshop } from '@features/workshop/pages/workshop/workshop';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';
import { ROUTE_TEXTS } from './testing/editorial-sources';

const WORKSHOP_TITLE = "L'atelier : outils de tourneur CN | Julien Nédellec";
const WORKSHOP_URL = `${SITE_IDENTITY.siteUrl}/atelier`;

const INSERT_GUIDE_TITLE = 'Guide des plaquettes de tournage | Julien Nédellec';
const INSERT_GUIDE_URL = `${SITE_IDENTITY.siteUrl}/atelier/plaquettes`;

const workshopRoute = (): Route | undefined => routes.find((route) => route.path === 'atelier');
const insertGuideRoute = (): Route | undefined =>
  routes.find((route) => route.path === 'atelier/plaquettes');

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

describe('insert guide route', () => {
  it('Given the guide url with a query string When navigated to Then the guide page answers, not the not-found page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/atelier/plaquettes?matiere=inconnue');
    const leaf = leafOf(router.routerState.snapshot.root);

    expect([leaf.routeConfig?.path, leaf.component]).toEqual(['atelier/plaquettes', InsertGuide]);
  });

  it('loads the page on demand, as a top-level route', async () => {
    const route = insertGuideRoute();

    expect(route?.component).toBeUndefined();
    expect(route?.loadChildren).toBeUndefined();
    expect(await route?.loadComponent?.()).toBe(InsertGuide);
  });

  it('titles the page in the tab with the proposed title', () => {
    expect(insertGuideRoute()?.title).toBe(INSERT_GUIDE_TITLE);
  });

  it('gives the page its SEO data, a canonical url without query string and a three-step breadcrumb', () => {
    expect(insertGuideRoute()?.data).toEqual({
      seo: {
        title: INSERT_GUIDE_TITLE,
        description:
          'Choisis ta matière et ton opération de tournage\u00a0: le guide indique le type de plaquette, sa géométrie et les pièges à éviter, avec la source de chaque donnée.',
        url: INSERT_GUIDE_URL,
        type: 'website',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
            { '@type': 'ListItem', position: 2, name: "L'atelier", item: WORKSHOP_URL },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Guide des plaquettes',
              item: INSERT_GUIDE_URL,
            },
          ],
        },
      },
    });
  });

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(insertGuideRoute()?.data?.['seo']?.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('hands its title and SEO data to the editorial locks', () => {
    expect(ROUTE_TEXTS['/atelier/plaquettes']).toEqual({
      title: INSERT_GUIDE_TITLE,
      seo: insertGuideRoute()?.data?.['seo'],
    });
  });
});

describe('workshop tools', () => {
  it('Given each tool path of the workshop When navigated to Then a declared route answers, not the not-found page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const router = TestBed.inject(Router);
    const reached: (readonly [string, string | undefined])[] = [];

    for (const { path } of WORKSHOP_SPACE.tools) {
      await router.navigateByUrl(path);
      reached.push([router.url, leafOf(router.routerState.snapshot.root).routeConfig?.path]);
    }

    expect(reached).toEqual(WORKSHOP_SPACE.tools.map(({ path }) => [path, path.slice(1)]));
  });
});
