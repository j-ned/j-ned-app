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

describe('nginx configuration', () => {
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
      '/atelier/plaquettes',
      '/atelier/plaquettes/',
    ])('relays %s to Node', (path) => {
      expect(relayed(path)).toBe(true);
    });

    it.each([
      '/atelier',
      '/atelier/',
      '/atelier/autre',
      '/atelier/plaquettes/autre',
      '/wp-login.php',
    ])('keeps %s away from Node', (path) => {
      expect(relayed(path)).toBe(false);
    });
  });
});
