import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { API_BASE_URL } from '@shared/api';
import { AuthStore } from './auth-store';
import { AuthGateway } from '@features/auth/domain';
import { HttpAuthGateway } from '@features/auth/infra/gateways/http-auth.gateway';

describe('AuthStore', () => {
  let service: AuthStore;
  let http: HttpTestingController;
  const apiBase = '/api';

  function setupService(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: apiBase },
        { provide: AuthGateway, useClass: HttpAuthGateway },
        AuthStore,
      ],
    });
    service = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    if (http) http.verify();
  });

  describe('Au boot (browser)', () => {
    beforeEach(() => setupService());

    it('appelle toujours GET /auth/me au démarrage (cookie httpOnly = source de vérité)', () => {
      const req = http.expectOne(`${apiBase}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
    });

    it('restore currentUser quand /auth/me retourne 200', async () => {
      http
        .expectOne(`${apiBase}/auth/me`)
        .flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
      await service.ready;
      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()?.email).toBe('a@b.fr');
    });

    it('reste déconnecté silencieusement quand /auth/me retourne 401', async () => {
      http.expectOne(`${apiBase}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
      await service.ready;
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      setupService();
      // Le restoreSession initial fire un GET /auth/me — on l'absorbe pour que
      // les tests login se concentrent sur leur propre requête.
      http.expectOne(`${apiBase}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('set currentUser sur success', () => {
      let outcome: string | undefined;
      service.login('a@b.fr', 'pwd').subscribe((r) => (outcome = r));
      http
        .expectOne(`${apiBase}/auth/login`)
        .flush({ user: { id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false } });
      expect(outcome).toBe('success');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('retourne "two-factor" quand requiresTwoFactor true et stocke le challengeToken', () => {
      let outcome: string | undefined;
      service.login('a@b.fr', 'pwd').subscribe((r) => (outcome = r));
      http
        .expectOne(`${apiBase}/auth/login`)
        .flush({ requiresTwoFactor: true, challengeToken: 'tok-xyz' });
      expect(outcome).toBe('two-factor');
      expect(service.pendingChallengeToken()).toBe('tok-xyz');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('retourne "error" sur échec réseau', () => {
      let outcome: string | undefined;
      service.login('a@b.fr', 'pwd').subscribe((r) => (outcome = r));
      http
        .expectOne(`${apiBase}/auth/login`)
        .flush({}, { status: 500, statusText: 'Server Error' });
      expect(outcome).toBe('error');
      expect(service.isLoggedIn()).toBe(false);
    });
  });
});
