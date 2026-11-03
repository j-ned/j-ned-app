import { isCrossOriginAllowed } from './cross-origin';

const SITE = 'https://nedellec-julien.fr';

type Headers = Readonly<Record<string, string>>;

describe('isCrossOriginAllowed', () => {
  const trusted = new Set([SITE]);
  const allows = (method: string, headers: Headers): boolean =>
    isCrossOriginAllowed(
      {
        method,
        origin: headers['origin'],
        fetchSite: headers['sec-fetch-site'],
      },
      trusted,
    );

  it.each(['GET'])(
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

  it.each(['DELETE'])(
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
