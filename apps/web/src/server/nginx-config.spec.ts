/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DOCKERFILE = readFileSync('Dockerfile', 'utf8');

const directivesOf = (pattern: RegExp): readonly string[] | null => {
  const block = pattern.exec(DOCKERFILE)?.[1];
  return block === undefined
    ? null
    : block
        .split(';')
        .map((directive) => directive.replace(/\s+/g, ' ').trim())
        .filter((directive) => directive !== '');
};

const RETIRED_LOCATION =
  /location ~ "?\^\/\(offres\|offre-site-industrie\|rendez-vous\)\(\/\|\$\)"? \{([^}]*)\}/;

const CLIENT_SHELL_LOCATION =
  /location ~ "?\^\/\(login\|two-factor\|admin\)\(\/\|\$\)"? \{([^}]*)\}/;
const FILE_LOCATION = /location \/ \{([^}]*)\}/;

describe('nginx configuration', () => {
  describe('HTML that Node does not render', () => {
    it.each<[string, RegExp]>([
      ['the client shell of login and admin', CLIENT_SHELL_LOCATION],
      ['the prerendered pages, 404 and 410 bodies', FILE_LOCATION],
    ])(
      'Given %s When it is served Then the browser revalidates it and keeps the security headers',
      (_, location) => {
        const directives = directivesOf(location) ?? [];

        expect({
          noCache: directives.includes('add_header Cache-Control "no-cache" always'),
          securityHeaders: directives.includes('include /etc/nginx/snippets/security-headers.conf'),
        }).toEqual({ noCache: true, securityHeaders: true });
      },
    );
  });

  // Spec 029 : offres et prise de rendez-vous retirées.
  describe('retired pages (offers and booking)', () => {
    it('answers 410 Gone so that search engines drop them for good', () => {
      expect(directivesOf(RETIRED_LOCATION)).toEqual(expect.arrayContaining(['return 410']));
    });

    it('renders the client shell as the 410 body instead of the bare nginx error page', () => {
      expect(directivesOf(RETIRED_LOCATION)).toEqual(
        expect.arrayContaining(['error_page 410 /index.csr.html']),
      );
    });

    it('no longer redirects any former offer URL to another offer', () => {
      expect(DOCKERFILE).not.toMatch(/return 301 \/offres/);
    });

    it('no longer serves the booking cancellation page from its own location', () => {
      expect(DOCKERFILE).not.toMatch(/location ~ "?\^\/rendez-vous\/annulation/);
    });
  });

  describe('routes rendered on request', () => {
    const SSR_LOCATION = /location ~ "?(\^\/\(about[^\s"]*)"? \{/;
    const relayed = (path: string): boolean => {
      const pattern = SSR_LOCATION.exec(DOCKERFILE)?.[1];
      return pattern !== undefined && new RegExp(pattern).test(path);
    };

    it.each([
      '/',
      '/about',
      '/projects/dashflow',
      '/blog/article',
      '/atelier',
      '/atelier/',
      '/atelier/plaquettes',
      '/atelier/plaquettes/',
      '/atelier/decodeur',
      '/atelier/decodeur/',
    ])('relays %s to Node', (path) => {
      expect(relayed(path)).toBe(true);
    });

    it.each([
      '/atelier/autre',
      '/atelier/plaquettes/autre',
      '/atelier/decodeur/autre',
      '/atelier/plaquettesdecodeur',
      '/wp-login.php',
    ])('keeps %s away from Node', (path) => {
      expect(relayed(path)).toBe(false);
    });
  });

  describe('relay to the Node renderer', () => {
    const SSR_PROXY = /ssr-proxy\.conf <<'PROXY'\n([\s\S]*?)\nPROXY/;
    const proxy = (): readonly string[] => directivesOf(SSR_PROXY) ?? [];

    it('writes the visitor address in the header the renderer is told to trust', () => {
      expect({
        header: proxy().includes('proxy_set_header X-Real-IP $ssr_visitor'),
        declared: /^(?:ENV)?\s+VISITOR_IP_HEADER=x-real-ip$/m.test(DOCKERFILE),
      }).toEqual({ header: true, declared: true });
    });

    it('forces the host, so that a request never picks the canonical origin', () => {
      expect(proxy()).toContain('proxy_set_header Host nedellec-julien.fr');
    });

    it.each(['Vercel-Cache-Tag', 'CDN-Cache-Control'])(
      'keeps the CDN header %s of the renderer away from the visitor',
      (header) => {
        expect(proxy()).toContain(`proxy_hide_header ${header}`);
      },
    );
  });

  // ADR-0038 : tout le trafic arrive par le tunnel Cloudflare, puis Traefik.
  describe('visitor behind the Cloudflare tunnel', () => {
    const mapOf = (source: string, target: string): readonly string[] =>
      directivesOf(new RegExp(`map \\$${source} \\$${target} \\{([^}]*)\\}`)) ?? [];

    it('takes the address written by Cloudflare, and the last forwarded entry only without it', () => {
      expect(mapOf('http_cf_connecting_ip', 'ssr_visitor')).toEqual([
        '"" $forwarded_last',
        'default $http_cf_connecting_ip',
      ]);
    });

    it('keeps a two-letter country and drops the unknown marker of Cloudflare', () => {
      expect(mapOf('http_cf_ipcountry', 'visitor_country')).toEqual([
        '"XX" ""',
        '"~^[A-Z][A-Z]$" $http_cf_ipcountry',
        'default ""',
      ]);
    });
  });

  // ADR-0034 : l'API est servie par l'origine du site.
  describe('API relayed on the site origin', () => {
    // Bloc complet d'une `location`, commentaires retirés : les accolades s'équilibrent
    // (`limit_except { … }`) et celles des variables du gabarit (`${API_UPSTREAM}`) ne comptent pas.
    const blockDirectives = (header: RegExp): readonly string[] => {
      const match = header.exec(DOCKERFILE);
      if (!match) return [];
      const start = match.index + match[0].length;
      let depth = 1;
      let index = start;
      while (index < DOCKERFILE.length && depth > 0) {
        if (DOCKERFILE.startsWith('${', index)) {
          index = DOCKERFILE.indexOf('}', index) + 1;
          continue;
        }
        if (DOCKERFILE[index] === '{') depth += 1;
        if (DOCKERFILE[index] === '}') depth -= 1;
        index += 1;
      }
      return DOCKERFILE.slice(start, index - 1)
        .replace(/#[^\n]*/g, '')
        .split(';')
        .map((directive) => directive.replace(/\s+/g, ' ').trim())
        .filter((directive) => directive !== '');
    };
    const API_LOCATION = /location \^~ \/api\/ \{/;
    const STORAGE_LOCATION = /location \^~ \/api\/storage\/ \{/;
    const TRACK_LOCATION = /location = \/api\/analytics\/track \{/;
    const API_RESPONSE_HEADERS = /api-response-headers\.conf <<'HEADERS'\n([\s\S]*?)\nHEADERS/;
    const api = (): readonly string[] => blockDirectives(API_LOCATION);

    it('relays every API path ahead of the file extension regex, with the security headers', () => {
      expect(api()).toEqual(
        expect.arrayContaining([
          'proxy_pass $api_upstream$request_uri',
          'include /etc/nginx/snippets/security-headers.conf',
        ]),
      );
    });

    it('accepts the largest upload of the API (4 MB file plus multipart envelope)', () => {
      expect(api()).toContain('client_max_body_size 5m');
    });

    it.each<[string, RegExp]>([
      ['the API', API_LOCATION],
      ['the audience beacon', TRACK_LOCATION],
    ])('hands %s the visitor address alone, never the forwarded chain', (_, location) => {
      expect(blockDirectives(location)).toContain('proxy_set_header X-Forwarded-For $ssr_visitor');
    });

    it.each<[string, RegExp]>([
      ['the API', API_LOCATION],
      ['the audience beacon', TRACK_LOCATION],
    ])(
      'hands %s the country resolved by Cloudflare, never a header of the visitor',
      (_, location) => {
        expect(blockDirectives(location)).toContain(
          'proxy_set_header X-Vercel-Ip-Country $visitor_country',
        );
      },
    );

    it('lets the session cookie through both ways', () => {
      expect({
        requestCookieStripped: api().some((d) => d.startsWith('proxy_set_header Cookie')),
        responseCookieHidden: api().includes('proxy_hide_header Set-Cookie'),
        sharedSnippetHidesCookie: (API_RESPONSE_HEADERS.exec(DOCKERFILE)?.[1] ?? '').includes(
          'Set-Cookie',
        ),
      }).toEqual({
        requestCookieStripped: false,
        responseCookieHidden: false,
        sharedSnippetHidesCookie: false,
      });
    });

    it.each<[string, RegExp]>([
      ['the cached images', STORAGE_LOCATION],
      ['the audience beacon', TRACK_LOCATION],
    ])('still hides any cookie set through %s', (_, location) => {
      expect(blockDirectives(location)).toContain('proxy_hide_header Set-Cookie');
    });
  });
});
