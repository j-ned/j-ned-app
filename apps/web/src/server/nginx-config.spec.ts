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
});
