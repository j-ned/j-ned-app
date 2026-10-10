import { describe, it, expect } from 'vitest';
import { SITE_IDENTITY } from '../identity/site-identity.static-data';
import { toShareImageUrl } from './share-image';

describe('toShareImageUrl', () => {
  it.each([
    {
      label: 'a cover served from the site',
      image: '/api/storage/portfolio-storage/blog/1.avif',
      expected: `${SITE_IDENTITY.siteUrl}/api/storage/portfolio-storage/blog/1.avif?variant=share`,
    },
    {
      label: 'a project capture served from the site',
      image: '/api/storage/portfolio-storage/project-images/img-1-ab12cd34.avif',
      expected: `${SITE_IDENTITY.siteUrl}/api/storage/portfolio-storage/project-images/img-1-ab12cd34.avif?variant=share`,
    },
    {
      label: 'an absolute address of the API',
      image: 'https://api.test/api/storage/portfolio-storage/blog/1.avif',
      expected: 'https://api.test/api/storage/portfolio-storage/blog/1.avif?variant=share',
    },
    {
      label: 'a protocol-relative address of another host',
      image: '//cdn.test/blog/1.avif',
      expected: '//cdn.test/blog/1.avif?variant=share',
    },
  ])(
    'Given $label When the share card is requested Then it is the absolute address of the share variant',
    ({ image, expected }) => {
      expect(toShareImageUrl(image)).toBe(expected);
    },
  );

  it("reste vide sans image (le SEO retombe alors sur l'avatar)", () => {
    expect(toShareImageUrl('')).toBe('');
  });
});
