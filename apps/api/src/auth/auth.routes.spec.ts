import { UnauthorizedException } from '../common/http-errors';
import { testApp } from '../common/test-app';
import type { AppConfigService } from '../config/app-config.service';
import { authRoutes } from './auth.routes';
import type { AuthService } from './auth.service';
import type { LoginJournalService } from './login-journal.service';
import type { RequireAuth } from './require-auth';

/** Routes montées sous leur préfixe avec le gestionnaire d'erreurs de l'API ; services et JWT remplacés. */
describe('auth routes', () => {
  const auth = { login: jest.fn(), verifyTwoFactor: jest.fn() };
  const journal = { findAll: jest.fn() };
  const passThrough: RequireAuth = async (_c, next) => {
    await next();
  };
  const denyAll: RequireAuth = () => {
    throw new UnauthorizedException();
  };
  const build = (requireAuth: RequireAuth) =>
    testApp(
      '/api/auth',
      authRoutes({
        auth: auth as unknown as AuthService,
        config: { jwtExpiresIn: '7d' } as unknown as AppConfigService,
        requireAuth,
        journal: journal as unknown as LoginJournalService,
      }),
    );
  const app = build(passThrough);

  const ORIGIN = { userAgent: 'Mozilla/5.0 test', country: 'FR' };
  const post = (path: string, body: unknown) =>
    app.request(`/api/auth/${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': ORIGIN.userAgent,
        'x-visitor-country': 'fr',
      },
      body: JSON.stringify(body),
    });

  beforeEach(() => jest.clearAllMocks());

  describe('origine transmise au journal des connexions', () => {
    it('Given a login, When the password step runs, Then it receives the browser and the country of the request', async () => {
      auth.login.mockResolvedValueOnce({
        kind: 'challenge',
        challengeToken: 'challenge-token',
      });

      const res = await post('login', {
        email: 'admin@example.com',
        password: 'a-long-password',
      });

      expect(res.status).toBe(200);
      expect(auth.login).toHaveBeenCalledWith(
        'admin@example.com',
        'a-long-password',
        ORIGIN,
      );
    });

    it('Given a second factor, When it is verified, Then it receives the browser and the country of the request', async () => {
      auth.verifyTwoFactor.mockResolvedValueOnce({
        token: 'session-token',
        user: { id: 'user-123' },
      });

      const res = await post('2fa/verify', {
        challengeToken: 'challenge-token',
        code: '123456',
      });

      expect(res.status).toBe(200);
      expect(auth.verifyTwoFactor).toHaveBeenCalledWith(
        'challenge-token',
        { code: '123456', backupCode: undefined },
        ORIGIN,
      );
    });
  });

  describe('GET login-events', () => {
    it('Given no admin session, When requested, Then 401 without reading the journal', async () => {
      const res = await build(denyAll).request('/api/auth/login-events');

      expect(res.status).toBe(401);
      expect(journal.findAll).not.toHaveBeenCalled();
    });

    it('Given an admin session, When page 2 of 5 is requested, Then 200 with that page of the journal', async () => {
      const page = { data: [{ id: 'event-1' }], total: 6, page: 2, limit: 5 };
      journal.findAll.mockResolvedValueOnce(page);

      const res = await app.request('/api/auth/login-events?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(page);
      expect(journal.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        offset: 5,
      });
    });

    it('Given a limit beyond 100, When requested, Then 400 without reading the journal', async () => {
      const res = await app.request('/api/auth/login-events?limit=101');

      expect(res.status).toBe(400);
      expect(journal.findAll).not.toHaveBeenCalled();
    });
  });
});
