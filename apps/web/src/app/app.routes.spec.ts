import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';
import { routes } from './app.routes';

const leafOf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leafOf(snapshot.firstChild) : snapshot;

async function navigate(url: string): Promise<{ url: string; leaf: ActivatedRouteSnapshot }> {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  return { url: router.url, leaf: leafOf(router.routerState.snapshot.root) };
}

describe('routes', () => {
  // Offres retirées (spec 029) : nginx répond 410 ; côté client, aucune route ne les sert plus.
  describe('retired offer urls', () => {
    it.each([
      '/offres',
      '/offres/site-vitrine',
      '/offres/application-metier',
      '/offre-site-industrie',
    ])(
      'Given %s When navigated to Then no route matches it but the not-found page, and no redirect happens',
      async (path) => {
        const { url, leaf } = await navigate(path);

        expect([url, leaf.routeConfig?.path]).toEqual([path, '**']);
      },
    );

    it('declares no route under /offres nor the former workshop url', () => {
      expect(
        routes.filter(({ path }) => path?.startsWith('offre')).map(({ path }) => path),
      ).toEqual([]);
    });
  });

  // Atelier retiré (ADR-0039) : accueil de l'atelier, guide des plaquettes et décodeur ne sont plus servis.
  describe('retired workshop urls', () => {
    it.each(['/atelier', '/atelier/plaquettes', '/atelier/decodeur'])(
      'Given %s When navigated to Then no route matches it but the not-found page, and no redirect happens',
      async (path) => {
        const { url, leaf } = await navigate(path);

        expect([url, leaf.routeConfig?.path]).toEqual([path, '**']);
      },
    );
  });

  // Sans challenge en cours, la page de code ne sert à rien et ne doit pas être atteignable par son URL.
  describe('two-factor challenge', () => {
    async function navigateToTwoFactor(challengeToken: string | null): Promise<string> {
      TestBed.configureTestingModule({
        providers: [
          provideRouter(routes),
          { provide: AuthStore, useValue: { pendingChallengeToken: signal(challengeToken) } },
        ],
      });
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/two-factor');
      return router.url;
    }

    it('Given no pending challenge When /two-factor is opened directly Then the visitor lands on /login', async () => {
      await expect(navigateToTwoFactor(null)).resolves.toBe('/login');
    });

    it('Given a challenge issued by the password step When /two-factor is opened Then the page is served', async () => {
      await expect(navigateToTwoFactor('challenge-token')).resolves.toBe('/two-factor');
    });
  });
});
