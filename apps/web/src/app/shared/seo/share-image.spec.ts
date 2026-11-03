/// <reference types="node" />
import { existsSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { SITE_IDENTITY } from '../identity/site-identity.static-data';
import { DEFAULT_SHARE_IMAGE, toShareImageUrl } from './share-image';

const CARD_FILE = /^julien-nedellec-\d{8}\.png$/;

const cardFiles = (): string[] =>
  existsSync('public/og') ? readdirSync('public/og').filter((name) => CARD_FILE.test(name)) : [];

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
  it('Given the public folder When the default card is looked up Then exactly one dated card exists and it is the one announced', () => {
    const files = cardFiles();

    expect({
      files: files.length,
      announced: DEFAULT_SHARE_IMAGE.url === `${SITE_IDENTITY.siteUrl}/og/${files[0]}`,
    }).toEqual({ files: 1, announced: true });
  });
});
