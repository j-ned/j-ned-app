/// <reference types="node" />
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import { SITE_IDENTITY } from '../identity/site-identity.static-data';
import { DEFAULT_SHARE_IMAGE, toShareImageUrl } from './share-image';

const CARD_FILE = /^julien-nedellec-\d{8}\.png$/;
const CARD_SOURCE = 'docs/og/og-default.html';

const cardFiles = (): string[] =>
  existsSync('public/og') ? readdirSync('public/og').filter((name) => CARD_FILE.test(name)) : [];

const pngHeaderOf = (
  path: string,
): { readonly signature: string; readonly width: number; readonly height: number } | null => {
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path);
  return {
    signature: bytes.subarray(0, 8).toString('hex'),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
};

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

  it('reste vide sans image (le SEO retombe alors sur la carte par défaut)', () => {
    expect(toShareImageUrl('')).toBe('');
  });
});

describe('DEFAULT_SHARE_IMAGE', () => {
  it('Given a page without its own visual When it is shared Then the card is the dated 1200×630 PNG, described by the name and the home headline', () => {
    expect(DEFAULT_SHARE_IMAGE).toEqual({
      url: expect.stringMatching(/^https:\/\/nedellec-julien\.fr\/og\/julien-nedellec-\d{8}\.png$/),
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: `Julien Nédellec. ${STATIC_HERO.headline}`,
    });
  });

  it('Given the public folder When the default card is looked up Then exactly one dated card exists and it is the one announced', () => {
    const files = cardFiles();

    expect({
      files: files.length,
      announced: DEFAULT_SHARE_IMAGE.url === `${SITE_IDENTITY.siteUrl}/og/${files[0]}`,
    }).toEqual({ files: 1, announced: true });
  });

  it('Given the default card file When its header is read Then it is a PNG of exactly 1200×630', () => {
    const [file] = cardFiles();

    expect(pngHeaderOf(`public/og/${file}`)).toEqual({
      signature: '89504e470d0a1a0a',
      width: 1200,
      height: 630,
    });
  });

  it('Given the card source When it is read Then it writes the name and the home headline, without photo nor gradient', () => {
    const source = existsSync(CARD_SOURCE) ? readFileSync(CARD_SOURCE, 'utf8') : '';

    expect({
      name: source.includes('Julien Nédellec'),
      headline: source.includes(STATIC_HERO.headline),
      images: (source.match(/<img\b/g) ?? []).length,
      gradients: (source.match(/gradient/g) ?? []).length,
    }).toEqual({ name: true, headline: true, images: 0, gradients: 0 });
  });
});
