/// <reference types="node" />
import { readFileSync } from 'node:fs';

const INDEX_HTML = readFileSync('src/index.html', 'utf8');

function cspOfIndex(): ReadonlyMap<string, string> {
  const content =
    new DOMParser()
      .parseFromString(INDEX_HTML, 'text/html')
      .querySelector('meta[http-equiv="Content-Security-Policy"]')
      ?.getAttribute('content') ?? '';
  return new Map(
    content
      .split(';')
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive): [string, string] => {
        const [name = '', ...sources] = directive.split(/\s+/);
        return [name, sources.join(' ')];
      }),
  );
}

describe('CSP of the site shell', () => {
  it('Given the comments are served by the site itself When the policy is read Then scripts and styles come from the site only, and no frame is allowed', () => {
    const csp = cspOfIndex();

    expect({
      script: csp.get('script-src'),
      style: csp.get('style-src'),
      frame: csp.get('frame-src') ?? null,
      default: csp.get('default-src'),
    }).toEqual({
      script: "'self' 'unsafe-inline'",
      style: "'self' 'unsafe-inline'",
      frame: null,
      default: "'self'",
    });
  });

  it('Given the shell of the site When it is read Then no third-party comment service is named anywhere', () => {
    expect(/giscus/i.test(INDEX_HTML)).toBe(false);
  });
});
