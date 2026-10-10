import { describe, it, expect } from 'vitest';
import { trackedPath } from './tracked-path';

describe('trackedPath', () => {
  it.each<[string, string]>([
    ['/offres/site-vitrine', '/offres/site-vitrine'],
    ['/offres/site-vitrine#demande', '/offres/site-vitrine'],
    ['/#contact', '/'],
    ['/', '/'],
    ['/blog?tag=angular', '/blog?tag=angular'],
    ['/blog?tag=angular#comments', '/blog?tag=angular'],
    ['/a#b#c', '/a'],
  ])('Given %s When the tracked path is computed Then it is %s', (url, expected) => {
    expect(trackedPath(url)).toBe(expected);
  });
});
