import { createHmac } from 'node:crypto';
import { generateSync } from 'otplib';
import { afterAll, describe, expect, it } from 'vitest';
import { expectApiError } from './api-error';
import { AUTH_COOKIE, cookieAttribute, cookieNamed, cookieValue, newVisitor } from './client';
import { parityEnv } from './env';
import { adminSession, login } from './session';

const base64url = (value: unknown): string =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

/** JWT signé avec un secret qui n'est pas celui de l'API. */
function foreignJwt(payload: object): string {
  const head = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}`;
  return `${head}.${createHmac('sha256', 'not-the-api-secret').update(head).digest('base64url')}`;
}

const subjectOf = (jwt: string): unknown =>
  JSON.parse(Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString()) as unknown;

/**
 * Attend la fenêtre TOTP suivante (30 s) : le code n'est pas celui qui a servi à activer la 2FA, la
 * suite ne dépend donc pas de la politique de rejeu de l'implémentation.
 */
const nextTotpStep = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 30_000 - (Date.now() % 30_000) + 1_000));

const me = (session: string) => newVisitor().request('GET', '/api/auth/me', { session });

describe('authentication', () => {
  it('Given the admin credentials, When logging in, Then a __Host- session cookie is set, strict and host-only', async () => {
    const response = await login();
    const cookie = cookieNamed(response.setCookies, AUTH_COOKIE) ?? '';

    expect(response.status).toBe(200);
    expect({
      httpOnly: cookieAttribute(cookie, 'HttpOnly'),
      secure: cookieAttribute(cookie, 'Secure'),
      sameSite: String(cookieAttribute(cookie, 'SameSite')).toLowerCase(),
      path: cookieAttribute(cookie, 'Path'),
      domain: cookieAttribute(cookie, 'Domain'),
      maxAge: cookieAttribute(cookie, 'Max-Age'),
    }).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: undefined,
      maxAge: String(7 * 24 * 3600),
    });
    expect(response.setCookies).toHaveLength(1);
  });

  it('Given a login, When it succeeds, Then the body exposes the public user only', async () => {
    const response = await login();

    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        email: parityEnv().adminEmail,
        isTwoFactorEnabled: false,
      },
    });
  });

  it('Given a wrong password and an unknown email, When logging in, Then both answers are identical (no user enumeration)', async () => {
    const wrongPassword = await login('wrong-password-for-parity');
    const unknownEmail = await newVisitor().request('POST', '/api/auth/login', {
      json: {
        email: 'nobody@parity.test',
        password: parityEnv().adminPassword,
      },
    });

    expectApiError(wrongPassword, 401, '/api/auth/login');
    expectApiError(unknownEmail, 401, '/api/auth/login');
    expect((unknownEmail.body as { message: unknown }).message).toEqual(
      (wrongPassword.body as { message: unknown }).message,
    );
    expect(wrongPassword.setCookies).toEqual([]);
  });

  it('Given a session, When /auth/me is read, Then it returns exactly id, email and 2FA status', async () => {
    const response = await me(await adminSession());

    expect(response.status).toBe(200);
    expect(Object.keys(response.body as object).sort()).toEqual([
      'email',
      'id',
      'isTwoFactorEnabled',
    ]);
  });

  it('Given a session, When it is sent as a Bearer token instead of the cookie, Then it is accepted', async () => {
    const session = await adminSession();
    const response = await newVisitor().request('GET', '/api/auth/me', {
      headers: { authorization: `Bearer ${session}` },
    });

    expect(response.status).toBe(200);
  });

  it('Given a valid JWT under the former cookie name, When /auth/me is read, Then it is refused', async () => {
    const session = await adminSession();
    const response = await newVisitor().request('GET', '/api/auth/me', {
      headers: { cookie: `token=${session}` },
    });

    expectApiError(response, 401);
  });

  it.each<[string, (sub: unknown) => string]>([
    ['signed with another secret', (sub) => foreignJwt({ sub, tokenVersion: 0 })],
    [
      'with alg "none"',
      (sub) => `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub, tokenVersion: 0 })}.`,
    ],
    [
      'whose signature was stripped',
      (sub) => `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub, tokenVersion: 0 })}.`,
    ],
  ])('Given a JWT %s for the admin, When it is presented, Then it is refused', async (_, forge) => {
    const { sub } = subjectOf(await adminSession()) as { sub: unknown };

    expectApiError(await me(forge(sub)), 401);
  });

  it('Given two sessions, When one logs out, Then both are revoked and the cookie is cleared', async () => {
    const first = await adminSession();
    const second = await adminSession();

    const logout = await newVisitor().request('POST', '/api/auth/logout', {
      session: first,
    });

    expect(logout.status).toBe(200);
    const cleared = cookieNamed(logout.setCookies, AUTH_COOKIE) ?? '';
    expect(cookieValue(cleared)).toBe('');
    expect(Date.parse(String(cookieAttribute(cleared, 'Expires')))).toBeLessThan(Date.now());
    expect((await me(first)).status).toBe(401);
    expect((await me(second)).status).toBe(401);
  });

  describe('two-factor authentication', () => {
    let session = '';
    let secret = '';
    let backupCodes: string[] = [];

    // La 2FA reste désactivée pour les autres fichiers, même si un test échoue en route.
    afterAll(async () => {
      if (!secret) return;
      const fresh = await login();
      const challenge = (fresh.body as { challengeToken?: string }).challengeToken;
      const token = challenge
        ? cookieValue(
            cookieNamed(
              (
                await newVisitor().request('POST', '/api/auth/2fa/verify', {
                  json: {
                    challengeToken: challenge,
                    backupCode: backupCodes.at(-1),
                  },
                })
              ).setCookies,
              AUTH_COOKIE,
            ) ?? '',
          )
        : await adminSession();
      await newVisitor().request('POST', '/api/auth/2fa/disable', {
        session: token,
        json: { password: parityEnv().adminPassword },
      });
    });

    it('Given a session, When 2FA is generated then enabled with a valid code, Then 10 one-time backup codes are returned', async () => {
      session = await adminSession();
      const generated = await newVisitor().request('POST', '/api/auth/2fa/generate', { session });
      secret = (generated.body as { secret: string }).secret;

      expect(generated.status).toBe(200);
      expect(Object.keys(generated.body as object).sort()).toEqual(['qrCodeDataUrl', 'secret']);

      const enabled = await newVisitor().request('POST', '/api/auth/2fa/enable', {
        session,
        json: { code: generateSync({ secret }) },
      });
      backupCodes = (enabled.body as { backupCodes: string[] }).backupCodes;

      expect(enabled.status).toBe(200);
      expect(backupCodes).toHaveLength(10);
      for (const code of backupCodes) expect(code).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    });

    it('Given 2FA enabled, When logging in with the password, Then only a challenge is returned, without any cookie', async () => {
      const response = await login();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        requiresTwoFactor: true,
        challengeToken: expect.any(String),
      });
      expect(response.setCookies).toEqual([]);
    });

    it('Given a challenge token, When it is presented as a session (cookie or Bearer), Then it is refused', async () => {
      const { challengeToken } = (await login()).body as {
        challengeToken: string;
      };

      expectApiError(await me(challengeToken), 401);
      expectApiError(
        await newVisitor().request('GET', '/api/auth/me', {
          headers: { authorization: `Bearer ${challengeToken}` },
        }),
        401,
      );
    });

    it.each<[string, Record<string, string>]>([
      ['a wrong TOTP code', { code: '000000' }],
      ['an unknown backup code', { backupCode: 'zzzz-zzzz' }],
    ])(
      'Given a challenge, When it is answered with %s, Then no session is opened',
      async (_, answer) => {
        const { challengeToken } = (await login()).body as {
          challengeToken: string;
        };
        const response = await newVisitor().request('POST', '/api/auth/2fa/verify', {
          json: { challengeToken, ...answer },
        });

        expectApiError(response, 401);
        expect(response.setCookies).toEqual([]);
      },
    );

    it('Given a challenge, When it is answered with both a code and a backup code, Then the body is refused', async () => {
      const { challengeToken } = (await login()).body as {
        challengeToken: string;
      };
      const response = await newVisitor().request('POST', '/api/auth/2fa/verify', {
        json: {
          challengeToken,
          code: generateSync({ secret }),
          backupCode: backupCodes[0],
        },
      });

      expectApiError(response, 400);
    });

    it('Given a forged challenge token, When it is answered with a valid code, Then it is refused', async () => {
      const { sub } = subjectOf(session) as { sub: unknown };
      const response = await newVisitor().request('POST', '/api/auth/2fa/verify', {
        json: {
          challengeToken: foreignJwt({ sub, scope: '2fa-challenge' }),
          code: generateSync({ secret }),
        },
      });

      expectApiError(response, 401);
    });

    it('Given a backup code, When it answers a challenge, Then it opens a session once and never again', async () => {
      const code = backupCodes[0];
      const answer = async () => {
        const { challengeToken } = (await login()).body as {
          challengeToken: string;
        };
        return newVisitor().request('POST', '/api/auth/2fa/verify', {
          json: { challengeToken, backupCode: code },
        });
      };

      const first = await answer();
      expect(first.status).toBe(200);
      expect(cookieNamed(first.setCookies, AUTH_COOKIE)).toBeDefined();

      expectApiError(await answer(), 401);
    });

    it('Given a valid TOTP code, When it answers a challenge, Then a session cookie is set', async () => {
      await nextTotpStep();
      const { challengeToken } = (await login()).body as {
        challengeToken: string;
      };
      const response = await newVisitor().request('POST', '/api/auth/2fa/verify', {
        json: { challengeToken, code: generateSync({ secret }) },
      });

      expect(response.status).toBe(200);
      expect(
        (await me(cookieValue(cookieNamed(response.setCookies, AUTH_COOKIE) ?? ''))).status,
      ).toBe(200);
    });

    it('Given 2FA enabled, When it is disabled with a wrong password, Then it stays enabled', async () => {
      const { challengeToken } = (await login()).body as {
        challengeToken: string;
      };
      const verified = await newVisitor().request('POST', '/api/auth/2fa/verify', {
        json: { challengeToken, backupCode: backupCodes[1] },
      });
      session = cookieValue(cookieNamed(verified.setCookies, AUTH_COOKIE) ?? '');

      const refused = await newVisitor().request('POST', '/api/auth/2fa/disable', {
        session,
        json: { password: 'wrong-password-for-parity' },
      });

      expect([400, 401]).toContain(refused.status);
      expect(((await me(session)).body as { isTwoFactorEnabled: boolean }).isTwoFactorEnabled).toBe(
        true,
      );
    });
  });
});
