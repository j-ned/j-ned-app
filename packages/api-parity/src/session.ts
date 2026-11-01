import { expect } from 'vitest';
import { AUTH_COOKIE, cookieNamed, cookieValue, newVisitor, type ApiResponse } from './client';
import { parityEnv } from './env';

export function login(password = parityEnv().adminPassword): Promise<ApiResponse> {
  return newVisitor().request('POST', '/api/auth/login', {
    json: { email: parityEnv().adminEmail, password },
  });
}

/** Ouvre une session admin (2FA désactivée) et rend la valeur du cookie. */
export async function adminSession(): Promise<string> {
  const response = await login();
  expect(response.status, response.text).toBe(200);
  const cookie = cookieNamed(response.setCookies, AUTH_COOKIE);
  expect(cookie, 'cookie de session absent').toBeDefined();
  return cookieValue(cookie ?? '');
}
