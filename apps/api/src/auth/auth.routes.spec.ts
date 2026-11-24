import { testApp } from '../testing/test-app';
import { TooManyRequestsException } from '../common/http-errors';
import { authRoutes } from './auth.routes';
import type { RequireAuth } from './require-auth';
import { denyAll, passThrough } from '../testing/require-auth';
import { notStubbed } from '../testing/stub';
import { createTestConfig } from '../testing/test-config';

// Routes montées sous leur préfixe avec le gestionnaire d'erreurs de l'API ; services et JWT remplacés.
describe('auth routes', () => {
  const auth = {
    login: jest.fn(),
    verifyTwoFactor: jest.fn(),
    changePassword: jest.fn(),
    disableTwoFactor: jest.fn(),
    revokeSessionFromToken: notStubbed('revokeSessionFromToken'),
    generateTwoFactorSecret: notStubbed('generateTwoFactorSecret'),
    enableTwoFactor: jest.fn(),
  };
  const journal = { findAll: jest.fn() };
  const build = (requireAuth: RequireAuth) =>
    testApp(
      '/api/auth',
      authRoutes({
        auth,
        config: createTestConfig({ JWT_EXPIRES_IN: '7d' }),
        requireAuth,
        journal,
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

  describe('activation de la 2FA', () => {
    it('Given no password, When 2FA is enabled, Then it gets 400 and the service is not called', async () => {
      const res = await post('2fa/enable', { code: '123456' });

      expect(res.status).toBe(400);
      expect(auth.enableTwoFactor).not.toHaveBeenCalled();
    });

    it('Given a password and a code, When 2FA is enabled, Then the service receives both', async () => {
      auth.enableTwoFactor.mockResolvedValueOnce({
        backupCodes: ['a1b2-c3d4'],
      });

      const res = await post('2fa/enable', {
        password: 'a-long-password',
        code: '123456',
      });

      expect(res.status).toBe(200);
      expect(auth.enableTwoFactor).toHaveBeenCalledWith(
        expect.objectContaining({}),
        'a-long-password',
        '123456',
      );
    });
  });

  describe('ré-authentification sous quota', () => {
    it.each<[string, 'changePassword' | 'disableTwoFactor', object]>([
      [
        'change-password',
        'changePassword',
        { currentPassword: 'a-long-password', newPassword: 'another-long-one' },
      ],
      ['2fa/disable', 'disableTwoFactor', { password: 'a-long-password' }],
    ])(
      'Given a locked account, When %s is called, Then 429 carries Retry-After in the API error format',
      async (path, method, body) => {
        auth[method].mockRejectedValueOnce(new TooManyRequestsException(840));

        const res = await post(path, body);

        expect(res.status).toBe(429);
        expect(res.headers.get('retry-after')).toBe('840');
        expect(await res.json()).toMatchObject({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Too Many Requests',
          path: `/api/auth/${path}`,
        });
      },
    );
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
