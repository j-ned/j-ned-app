import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL } from '@shared/api/api-config';
import { AuthStore, SESSION_HINT_KEY } from './auth-store';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';
import { HttpAuthGateway } from '@features/auth/infra/gateways/http-auth.gateway';
import { authInterceptor } from '@features/auth/infra/auth-interceptor';

describe('AuthStore', () => {
  let service: AuthStore;
  let http: HttpTestingController;
  const apiBase = '/api';

  function setupService(options: { withAuthInterceptor?: boolean } = {}): void {
    TestBed.configureTestingModule({
      providers: [
        options.withAuthInterceptor
          ? provideHttpClient(withInterceptors([authInterceptor]))
          : provideHttpClient(),
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
    localStorage.removeItem(SESSION_HINT_KEY);
  });

  describe('Au boot (browser)', () => {
    it('ne fait aucune requête sans indice local de session (visiteur anonyme)', async () => {
      setupService();
      service.restoreSession();
      http.expectNone(`${apiBase}/auth/me`);
      await service.ready;
      expect(service.isLoggedIn()).toBe(false);
    });

    it("ne fait aucune requête à la construction : c'est l'initialiseur d'app qui restaure", () => {
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setupService();
      http.expectNone(`${apiBase}/auth/me`);
      expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1');
    });

    it("appelle GET /auth/me quand l'indice est présent (cookie httpOnly = source de vérité)", () => {
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setupService();
      service.restoreSession();
      const req = http.expectOne(`${apiBase}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
    });

    it("traverse authInterceptor (qui injecte AuthStore) sans dépendance circulaire ni perte de l'indice", async () => {
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setupService({ withAuthInterceptor: true });
      service.restoreSession();
      http
        .expectOne(`${apiBase}/auth/me`)
        .flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
      await service.ready;
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1');
    });

    it('restore currentUser quand /auth/me retourne 200', async () => {
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setupService();
      service.restoreSession();
      http
        .expectOne(`${apiBase}/auth/me`)
        .flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
      await service.ready;
      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()?.email).toBe('a@b.fr');
      expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1');
    });

    it("reste déconnecté silencieusement et efface l'indice quand /auth/me retourne 401", async () => {
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setupService();
      service.restoreSession();
      http.expectOne(`${apiBase}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
      await service.ready;
      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull();
    });

    it.each([
      { status: 0, statusText: 'Network error' },
      { status: 503, statusText: 'Service Unavailable' },
    ])(
      "garde l'indice quand /auth/me échoue pour une autre raison qu'un 401 ($status)",
      async ({ status, statusText }) => {
        localStorage.setItem(SESSION_HINT_KEY, '1');
        setupService();
        service.restoreSession();
        http.expectOne(`${apiBase}/auth/me`).flush({}, { status, statusText });
        await service.ready;
        expect(service.isLoggedIn()).toBe(false);
        expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1');
      },
    );
  });

  describe('login', () => {
    beforeEach(() => setupService());

    it('set currentUser sur success', () => {
      let outcome: string | undefined;
      service.login('a@b.fr', 'pwd').subscribe((r) => (outcome = r));
      http
        .expectOne(`${apiBase}/auth/login`)
        .flush({ user: { id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false } });
      expect(outcome).toBe('success');
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1');
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
