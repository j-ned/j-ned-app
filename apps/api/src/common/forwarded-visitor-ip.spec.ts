import { Hono } from 'hono';
import { clientIp, forwardedVisitorIp, type AppEnv } from './http';

const SECRET = 'a'.repeat(40);

const app = (secret: string | undefined) =>
  new Hono<AppEnv>()
    .use(forwardedVisitorIp(secret))
    .get('/ip', (c) => c.text(clientIp(c)));

const ip = async (
  secret: string | undefined,
  headers: Record<string, string>,
) => (await app(secret).request('/ip', { headers })).text();

describe('clientIp', () => {
  it.each<[string, string]>([
    ['an IPv4 address', '203.0.113.7'],
    ['an IPv6 address', '2001:db8::7'],
  ])(
    'Given %s as the last X-Forwarded-For entry, When the IP is read, Then it is the client IP',
    async (_, address) => {
      expect(
        await ip(undefined, { 'x-forwarded-for': `198.51.100.1, ${address}` }),
      ).toBe(address);
    },
  );

  it.each<[string, string]>([
    ['an arbitrary string', 'evil'],
    ['an 8 kB entry', 'a'.repeat(8 * 1024)],
    ['an address followed by a port', '203.0.113.7:4242'],
    ['a valid address before an invalid last entry', '203.0.113.7, evil'],
  ])(
    'Given %s in X-Forwarded-For, When the IP is read, Then the header is ignored as if absent',
    async (_, forwarded) => {
      expect(await ip(undefined, { 'x-forwarded-for': forwarded })).toBe(
        await ip(undefined, {}),
      );
    },
  );
});

describe('forwardedVisitorIp', () => {
  const FROM_RENDER = { 'x-forwarded-for': '10.0.0.5' };

  it('Given the shared secret, When the render forwards the visitor IP, Then that IP is the client IP', async () => {
    expect(
      await ip(SECRET, {
        ...FROM_RENDER,
        'x-ssr-secret': SECRET,
        'x-ssr-visitor-ip': '203.0.113.7',
      }),
    ).toBe('203.0.113.7');
  });

  it.each<[string, string | undefined, Record<string, string>]>([
    [
      'a wrong secret',
      SECRET,
      { 'x-ssr-secret': 'b'.repeat(40), 'x-ssr-visitor-ip': '203.0.113.7' },
    ],
    ['no secret header', SECRET, { 'x-ssr-visitor-ip': '203.0.113.7' }],
    [
      'no secret configured',
      undefined,
      { 'x-ssr-secret': SECRET, 'x-ssr-visitor-ip': '203.0.113.7' },
    ],
    [
      'a value that is not an IP',
      SECRET,
      { 'x-ssr-secret': SECRET, 'x-ssr-visitor-ip': 'evil' },
    ],
  ])(
    'Given %s, When the IP is read, Then the forwarded one is ignored',
    async (_, secret, headers) => {
      expect(await ip(secret, { ...FROM_RENDER, ...headers })).toBe('10.0.0.5');
    },
  );
});
