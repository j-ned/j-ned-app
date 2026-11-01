import { describe, expect, it } from 'vitest';
import { expectApiError } from './api-error';
import { newVisitor, send, type Visitor } from './client';

const WRONG_LOGIN = {
  email: 'nobody@parity.test',
  password: 'wrong-password-for-parity',
};

async function statuses(count: number, call: () => Promise<{ status: number }>): Promise<number[]> {
  const result: number[] = [];
  for (let i = 0; i < count; i += 1) result.push((await call()).status);
  return result;
}

const loginAttempt = (visitor: Visitor) =>
  visitor.request('POST', '/api/auth/login', { json: WRONG_LOGIN });

describe('rate limiting per visitor', () => {
  it('Given a visitor, When it tries a 6th login within a minute, Then it gets 429 in the API error format', async () => {
    const visitor = newVisitor();

    expect(await statuses(5, () => loginAttempt(visitor))).toEqual([401, 401, 401, 401, 401]);
    expectApiError(await loginAttempt(visitor), 429, '/api/auth/login');
  });

  it('Given a throttled visitor, When another visitor logs in, Then the other visitor is not affected', async () => {
    const throttled = newVisitor();
    await statuses(6, () => loginAttempt(throttled));

    expect((await loginAttempt(newVisitor())).status).toBe(401);
  });

  // L'API retient la dernière entrée de X-Forwarded-For, celle qu'écrit le proxy de confiance : les
  // entrées antérieures viennent du client et se forgent.
  it('Given a throttled visitor, When it prepends a forged address to X-Forwarded-For, Then it is still throttled', async () => {
    const throttled = newVisitor();
    await statuses(6, () => loginAttempt(throttled));

    const forged = await send(`203.0.113.99, ${throttled.ip}`, 'POST', '/api/auth/login', {
      json: WRONG_LOGIN,
    });

    expect(forged.status).toBe(429);
  });

  it('Given a visitor, When it answers 2FA challenges, Then it shares nothing with the login quota but has its own 5 per minute', async () => {
    const visitor = newVisitor();
    const verify = () =>
      visitor.request('POST', '/api/auth/2fa/verify', {
        json: { challengeToken: 'x', code: '000000' },
      });

    expect(await statuses(5, verify)).toEqual([401, 401, 401, 401, 401]);
    expect((await verify()).status).toBe(429);
  });

  it('Given a visitor, When it sends a 4th contact message within an hour, Then it gets 429 (invalid bodies count too)', async () => {
    const visitor = newVisitor();
    const contact = () => visitor.request('POST', '/api/contact/messages', { json: {} });

    expect(await statuses(3, contact)).toEqual([400, 400, 400]);
    expect((await contact()).status).toBe(429);
  });

  it('Given a visitor, When it calls a route under the default quota 11 times in a minute, Then the 11th gets 429', async () => {
    const visitor = newVisitor();
    const health = () => visitor.request('GET', '/api/health');

    expect(await statuses(10, health)).toEqual(Array(10).fill(200));
    expect((await health()).status).toBe(429);
  });

  it('Given a visitor, When it reads public content 30 times in a row, Then it is not throttled (120 per minute)', async () => {
    const visitor = newVisitor();

    expect(new Set(await statuses(30, () => visitor.request('GET', '/api/projects')))).toEqual(
      new Set([200]),
    );
  });
});
