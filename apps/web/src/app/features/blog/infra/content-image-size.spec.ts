import { describe, it, expect } from 'vitest';
import { contentImageSize } from './content-image-size';

const KEY = '3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f-a1b2c3d4';
const PROD = 'https://api.nedellec-julien.fr/api/storage/portfolio-storage';

describe('contentImageSize', () => {
  it.each([
    { href: `${PROD}/blog-content/${KEY}-1600x900.avif`, width: 1600, height: 900 },
    {
      href: `/api/storage/portfolio-storage/blog-content/${KEY}-800x1200.avif`,
      width: 800,
      height: 1200,
    },
    { href: `/storage/portfolio-storage/blog-content/${KEY}-1x1.avif`, width: 1, height: 1 },
  ])(
    'Given the body image $href When its size is read Then it is $width × $height',
    ({ href, width, height }) => {
      expect(contentImageSize(href)).toEqual({ width, height });
    },
  );

  it.each([
    ['a cover', `${PROD}/blog/${KEY}.avif`],
    [
      'another host',
      `https://example.com/api/storage/portfolio-storage/blog-content/${KEY}-1600x900.avif`,
    ],
    [
      'another bucket',
      `https://api.nedellec-julien.fr/api/storage/other-bucket/blog-content/${KEY}-1600x900.avif`,
    ],
    ['no size', `${PROD}/blog-content/${KEY}.avif`],
    ['half a size', `${PROD}/blog-content/${KEY}-1600x.avif`],
    ['a zero width', `${PROD}/blog-content/${KEY}-0x900.avif`],
    ['another format', `${PROD}/blog-content/${KEY}-1600x900.png`],
    [
      'a truncated hash',
      `${PROD}/blog-content/3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f-a1b2-1600x900.avif`,
    ],
    ['a trailing query', `${PROD}/blog-content/${KEY}-1600x900.avif?v=2`],
    ['an empty address', ''],
  ])('Given %s When its size is read Then there is none', (_case, href) => {
    expect(contentImageSize(href)).toBeNull();
  });
});
