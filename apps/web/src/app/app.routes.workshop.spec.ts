import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type Route, Router, provideRouter } from '@angular/router';
import { WORKSHOP_SPACE } from '@features/workshop/domain/workshop-space.static-data';
import { InsertDecoder } from '@features/workshop/pages/insert-decoder/insert-decoder';
import { InsertGuide } from '@features/workshop/pages/insert-guide/insert-guide';
import { Workshop } from '@features/workshop/pages/workshop/workshop';
import { API_BASE_URL } from '@shared/api/api-config';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';
import { ROUTE_TEXTS } from './testing/editorial-sources';

const WORKSHOP_TITLE = "L'atelier\u00a0: outils de tourneur CN | Julien Nédellec";
const WORKSHOP_URL = `${SITE_IDENTITY.siteUrl}/atelier`;

const INSERT_GUIDE_TITLE = 'Guide des plaquettes de tournage | Julien Nédellec';
const INSERT_GUIDE_URL = `${SITE_IDENTITY.siteUrl}/atelier/plaquettes`;

const INSERT_DECODER_TITLE = 'Décodeur de code plaquette ISO | Julien Nédellec';
const INSERT_DECODER_URL = `${SITE_IDENTITY.siteUrl}/atelier/decodeur`;

const workshopRoute = (): Route | undefined => routes.find((route) => route.path === 'atelier');
const insertGuideRoute = (): Route | undefined =>
  routes.find((route) => route.path === 'atelier/plaquettes');

const insertDecoderRoute = (): Route | undefined =>
  routes.find((route) => route.path === 'atelier/decodeur');

// Les pages lisent le guide dans l'API : la lecture reste en attente, seule la route compte ici.
const configureRouter = (): Router => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api' },
    ],
  });
  return TestBed.inject(Router);
};

const leafOf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leafOf(snapshot.firstChild) : snapshot;

describe('workshop route', () => {
  it('Given the workshop url When navigated to Then the workshop page answers, not the not-found page', async () => {
    const router = configureRouter();

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
          "Mon coin de tourneur CN\u00a0: des outils d'usinage, à commencer par le guide des plaquettes que j'utilise à l'atelier, matière par matière.",
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
    const router = configureRouter();

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
          "Les plaquettes de tournage que j'utilise à l'atelier, matière par matière\u00a0: opération, plaquette, rayon de bec et remarque, à adapter à ta machine.",
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

describe('insert decoder route', () => {
  it('Given the decoder url with a code When navigated to Then the decoder page answers, not the not-found page', async () => {
    const router = configureRouter();

    await router.navigateByUrl('/atelier/decodeur?code=CNMG120408');
    const leaf = leafOf(router.routerState.snapshot.root);

    expect([leaf.routeConfig?.path, leaf.component]).toEqual(['atelier/decodeur', InsertDecoder]);
  });

  it('loads the page on demand, as a top-level route', async () => {
    const route = insertDecoderRoute();

    expect(route?.component).toBeUndefined();
    expect(route?.loadChildren).toBeUndefined();
    expect(await route?.loadComponent?.()).toBe(InsertDecoder);
  });

  it('titles the page in the tab with the proposed title', () => {
    expect(insertDecoderRoute()?.title).toBe(INSERT_DECODER_TITLE);
  });

  it('gives the page its SEO data, a canonical url without query string and a three-step breadcrumb', () => {
    expect(insertDecoderRoute()?.data).toEqual({
      seo: {
        title: INSERT_DECODER_TITLE,
        description:
          "Tape le code ISO d'une plaquette de tournage, comme CNMG 120408\u00a0: le décodeur explique chaque lettre et chaque chiffre, sources fabricants à l'appui.",
        url: INSERT_DECODER_URL,
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
              name: 'Décodeur de plaquette',
              item: INSERT_DECODER_URL,
            },
          ],
        },
      },
    });
  });

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(insertDecoderRoute()?.data?.['seo']?.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('hands its title and SEO data to the editorial locks', () => {
    expect(ROUTE_TEXTS['/atelier/decodeur']).toEqual({
      title: INSERT_DECODER_TITLE,
      seo: insertDecoderRoute()?.data?.['seo'],
    });
  });
});

describe('workshop tools', () => {
  it('Given each tool path of the workshop When navigated to Then a declared route answers, not the not-found page', async () => {
    const router = configureRouter();
    const reached: (readonly [string, string | undefined])[] = [];

    for (const { path } of WORKSHOP_SPACE.tools) {
      await router.navigateByUrl(path);
      reached.push([router.url, leafOf(router.routerState.snapshot.root).routeConfig?.path]);
    }

    expect(reached).toEqual(WORKSHOP_SPACE.tools.map(({ path }) => [path, path.slice(1)]));
  });
});
