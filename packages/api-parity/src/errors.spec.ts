import { describe, it } from 'vitest';
import { expectApiError } from './api-error';
import { newVisitor } from './client';

describe('request validation and error format', () => {
  it('Given malformed JSON, When it is posted, Then the API answers 400 in its error format', async () => {
    const response = await newVisitor().request('POST', '/api/auth/login', {
      body: '{"email":',
      headers: { 'content-type': 'application/json' },
    });

    expectApiError(response, 400, '/api/auth/login');
  });

  it('Given a field the endpoint does not know, When it is posted, Then the body is refused (no silent strip)', async () => {
    const response = await newVisitor().request('POST', '/api/auth/login', {
      json: {
        email: 'someone@parity.test',
        password: 'long-enough-password',
        isAdmin: true,
      },
    });

    expectApiError(response, 400);
  });

  it.each<[string, unknown]>([
    ['an invalid email', { email: 'not-an-email', password: 'long-enough-password' }],
    ['a password under 12 characters', { email: 'someone@parity.test', password: 'short' }],
    ['a missing password', { email: 'someone@parity.test' }],
    ['an array instead of an object', ['someone@parity.test']],
  ])('Given %s, When logging in, Then the API answers 400 before any lookup', async (_, json) => {
    expectApiError(await newVisitor().request('POST', '/api/auth/login', { json }), 400);
  });

  it('Given a JSON body over 100 kB, When it is posted, Then the API answers 413 in its error format', async () => {
    const response = await newVisitor().request('POST', '/api/contact/messages', {
      json: { message: 'x'.repeat(200 * 1024) },
    });

    expectApiError(response, 413, '/api/contact/messages');
  });
});
