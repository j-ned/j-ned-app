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

const CANCELLATION_LOCATION = /location ~ "?\^\/rendez-vous\/annulation\/\?\$"? \{([^}]*)\}/;
const RETIRED_OFFERS_LOCATION =
  /location ~ "?\^\/\(offres\|offre-site-industrie\)\(\/\|\$\)"? \{([^}]*)\}/;

describe('nginx configuration', () => {
  describe('booking cancellation page', () => {
    it('serves the browser-rendered shell with a 200 instead of falling into the 404 page', () => {
      expect(directivesOf(CANCELLATION_LOCATION)).toEqual(
        expect.arrayContaining(['try_files /index.csr.html =404']),
      );
    });

    it('tells robots not to index or follow it, before any JavaScript runs', () => {
      expect(directivesOf(CANCELLATION_LOCATION)).toEqual(
        expect.arrayContaining(['add_header X-Robots-Tag "noindex, nofollow" always']),
      );
    });

    // Un add_header dans une location annule ceux du server : sans le snippet, plus de HSTS ni de CSP.
    it('keeps the security headers its own header would otherwise drop', () => {
      expect(directivesOf(CANCELLATION_LOCATION)).toEqual(
        expect.arrayContaining(['include /etc/nginx/snippets/security-headers.conf']),
      );
    });
  });

  describe('retired offer pages', () => {
    it('answers 410 Gone so that search engines drop them for good', () => {
      expect(directivesOf(RETIRED_OFFERS_LOCATION)).toEqual(expect.arrayContaining(['return 410']));
    });

    it('renders the client shell as the 410 body instead of the bare nginx error page', () => {
      expect(directivesOf(RETIRED_OFFERS_LOCATION)).toEqual(
        expect.arrayContaining(['error_page 410 /index.csr.html']),
      );
    });

    it('no longer redirects any former offer URL to another offer', () => {
      expect(DOCKERFILE).not.toMatch(/return 301 \/offres/);
    });
  });
});
