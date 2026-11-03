import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type Route, Router, provideRouter } from '@angular/router';
import { WORKSHOP_SPACE } from '@features/workshop/domain/workshop-space.static-data';
import { InsertDecoder } from '@features/workshop/pages/insert-decoder/insert-decoder';
import { InsertGuide } from '@features/workshop/pages/insert-guide/insert-guide';
import { Workshop } from '@features/workshop/pages/workshop/workshop';
import { API_BASE_URL } from '@shared/api/api-config';
import { routes } from './app.routes';

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

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(workshopRoute()?.data?.['seo']?.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
  });
});

describe('insert guide route', () => {
  it('Given the guide url with a query string When navigated to Then the guide page answers, not the not-found page', async () => {
    const router = configureRouter();

    await router.navigateByUrl('/atelier/plaquettes?matiere=inconnue');
    const leaf = leafOf(router.routerState.snapshot.root);

    expect([leaf.routeConfig?.path, leaf.component]).toEqual(['atelier/plaquettes', InsertGuide]);
  });

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(insertGuideRoute()?.data?.['seo']?.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
  });
});

describe('insert decoder route', () => {
  it('Given the decoder url with a code When navigated to Then the decoder page answers, not the not-found page', async () => {
    const router = configureRouter();

    await router.navigateByUrl('/atelier/decodeur?code=CNMG120408');
    const leaf = leafOf(router.routerState.snapshot.root);

    expect([leaf.routeConfig?.path, leaf.component]).toEqual(['atelier/decodeur', InsertDecoder]);
  });

  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(insertDecoderRoute()?.data?.['seo']?.description ?? '');

    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(160);
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
