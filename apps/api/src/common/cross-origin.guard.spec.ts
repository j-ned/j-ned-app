import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { CrossOriginGuard } from './cross-origin.guard';

const SITE = 'https://nedellec-julien.fr';

type Headers = Readonly<Record<string, string>>;

function contextFor(method: string, headers: Headers): ExecutionContext {
  const req = { method, get: (name: string) => headers[name.toLowerCase()] };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('CrossOriginGuard', () => {
  const guard = new CrossOriginGuard([SITE]);
  const allows = (method: string, headers: Headers): boolean => {
    try {
      return guard.canActivate(contextFor(method, headers));
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  };

  it.each(['GET', 'HEAD', 'OPTIONS'])(
    'Given a cross-site %s, When checked, Then it passes (reads change nothing)',
    (method) => {
      expect(
        allows(method, {
          'sec-fetch-site': 'cross-site',
          origin: 'https://evil.example',
        }),
      ).toBe(true);
    },
  );

  it.each<[string, Headers]>([
    ['a same-origin fetch', { 'sec-fetch-site': 'same-origin', origin: SITE }],
    ['a navigation typed by the user', { 'sec-fetch-site': 'none' }],
    [
      'the site calling its API subdomain',
      { 'sec-fetch-site': 'same-site', origin: SITE },
    ],
    ['an older browser on the trusted origin', { origin: SITE }],
    ['a non-browser client (no Origin, no Sec-Fetch-Site)', {}],
  ])('Given %s, When it writes, Then it passes', (_, headers) => {
    expect(allows('POST', headers)).toBe(true);
  });

  it.each<[string, Headers]>([
    [
      'a cross-site form post',
      { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' },
    ],
    [
      'a sibling subdomain',
      {
        'sec-fetch-site': 'same-site',
        origin: 'https://evil.nedellec-julien.fr',
      },
    ],
    [
      'an older browser on an untrusted origin',
      { origin: 'https://evil.example' },
    ],
    ['an opaque origin (sandboxed iframe)', { origin: 'null' }],
    [
      'a cross-site request whose Origin was stripped',
      { 'sec-fetch-site': 'cross-site' },
    ],
  ])('Given %s, When it writes, Then it is rejected', (_, headers) => {
    expect(allows('POST', headers)).toBe(false);
  });

  it.each(['PUT', 'PATCH', 'DELETE'])(
    'Given a cross-site %s, When checked, Then it is rejected like a POST',
    (method) => {
      expect(
        allows(method, {
          'sec-fetch-site': 'cross-site',
          origin: 'https://evil.example',
        }),
      ).toBe(false);
    },
  );
});
