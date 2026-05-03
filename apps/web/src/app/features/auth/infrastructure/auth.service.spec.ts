import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AUTH_BASE_URL } from '@shared/api';
import { AuthService } from './auth.service';
import { AUTH_GATEWAY } from '../domain';
import { HttpAuthGateway } from './gateways/http-auth.gateway';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const apiBase = '/api';

  function setupService(withSession = false): void {
    if (withSession) {
      localStorage.setItem('has_session', '1');
    } else {
      localStorage.removeItem('has_session');
    }
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AUTH_BASE_URL, useValue: apiBase },
        { provide: AUTH_GATEWAY, useClass: HttpAuthGateway },
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    if (http) http.verify();
    localStorage.removeItem('has_session');
  });

  describe('Given no previous session flag in localStorage', () => {
    beforeEach(() => setupService(false));

    it('isLoggedIn is false at startup', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('does not call /auth/me at startup', async () => {
      await service.ready;
      http.expectNone(`${apiBase}/auth/me`);
    });
  });

  describe('Given a persisted session flag', () => {
    beforeEach(() => setupService(true));

    it('calls GET /auth/me at startup', () => {
      const req = http.expectOne(`${apiBase}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
    });

    it('restores currentUser after successful getCurrentUser', async () => {
      http
        .expectOne(`${apiBase}/auth/me`)
        .flush({ id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false });
      await service.ready;
      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()?.email).toBe('a@b.fr');
    });

    it('clears session flag if getCurrentUser fails', async () => {
      http
        .expectOne(`${apiBase}/auth/me`)
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      await service.ready;
      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('has_session')).toBeNull();
    });
  });

  describe('login', () => {
    beforeEach(() => setupService(false));

    it('sets currentUser and localStorage on success', () => {
      let outcome: string | undefined;
      service.login('a@b.fr', 'pwd').subscribe((r) => (outcome = r));
      http
        .expectOne(`${apiBase}/auth/login`)
        .flush({ user: { id: 'u1', email: 'a@b.fr', isTwoFactorEnabled: false } });
      expect(outcome).toBe('success');
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.getItem('has_session')).toBe('1');
    });

    it('returns "two-factor" when requiresTwoFactor true and stores challengeToken', () => {
      let outcome: string | undefined;
      service.login('a@b.fr', 'pwd').subscribe((r) => (outcome = r));
      http
        .expectOne(`${apiBase}/auth/login`)
        .flush({ requiresTwoFactor: true, challengeToken: 'tok-xyz' });
      expect(outcome).toBe('two-factor');
      expect(service.pendingChallengeToken()).toBe('tok-xyz');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns "error" on network failure', () => {
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
