/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APP_DIR = 'src/app';
const PRIVATE_AREAS = new Set(['admin', 'auth']);

const sourcesUnder = (root: string): readonly string[] =>
  readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'))
    .map((path) => join(root, path));

const isPublic = (path: string): boolean =>
  !path.split(/[\\/]/).some((segment) => PRIVATE_AREAS.has(segment));

const PUBLIC_SOURCES = sourcesUnder(APP_DIR).filter(isPublic);
const ALL_SOURCES = [...sourcesUnder(APP_DIR), 'src/index.html'];
const STYLES = readFileSync('src/styles.css', 'utf8');

const tokensIn = (path: string, pattern: RegExp): readonly string[] =>
  readFileSync(path, 'utf8').match(pattern) ?? [];

const offenders = (pattern: RegExp): readonly string[] =>
  PUBLIC_SOURCES.flatMap((path) =>
    tokensIn(path, pattern).map((token) => `${path.replaceAll('\\', '/')}: ${token}`),
  ).sort();

const isUsed = (utility: string): boolean => {
  const token = new RegExp(`(?<![\\w-])${utility}(?![\\w-])`);
  const otherUtilities = STYLES.split('@utility ').filter(
    (chunk) => !chunk.startsWith(`${utility} {`),
  );
  return (
    otherUtilities.some((chunk) => token.test(chunk)) ||
    ALL_SOURCES.some((path) => token.test(readFileSync(path, 'utf8')))
  );
};

describe('public templates', () => {
  it('Given the public templates When their corners are read Then they only use the named radii, never the generic md to 2xl steps', () => {
    expect(
      offenders(/(?<![\w-])rounded(?:-[trblse]{1,2})?-(?:md|lg|xl|2xl|3xl)(?![\w-])/g),
    ).toEqual([]);
  });

  it('Given the public templates When their labels are read Then none is set in capitals', () => {
    expect(offenders(/(?<![\w-])uppercase(?![\w-])/g)).toEqual([]);
  });
});

describe('global utilities', () => {
  it('Given the utilities of the stylesheet When the sources are read Then each one still has a consumer', () => {
    const declared = [...STYLES.matchAll(/^@utility ([\w-]+) \{/gm)].map(([, name]) => name);

    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((utility) => !isUsed(utility))).toEqual([]);
  });
});
