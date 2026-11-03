/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { DEFAULT_SHARE_IMAGE } from './shared/seo/share-image';

const parse = (path: string, type: DOMParserSupportedType): Document =>
  new DOMParser().parseFromString(readFileSync(path, 'utf8'), type);

describe('browser identity', () => {
  it('Given the static page When a social network reads it Then it announces the default share card, the same as the SEO service', () => {
    const head = parse('src/index.html', 'text/html').head;
    const content = (selector: string): string | null =>
      head.querySelector(`meta[${selector}]`)?.getAttribute('content') ?? null;

    expect({
      image: content('property="og:image"'),
      alt: content('property="og:image:alt"'),
      width: content('property="og:image:width"'),
      height: content('property="og:image:height"'),
      type: content('property="og:image:type"'),
      card: content('name="twitter:card"'),
    }).toEqual({
      image: DEFAULT_SHARE_IMAGE.url,
      alt: DEFAULT_SHARE_IMAGE.alt,
      width: '1200',
      height: '630',
      type: 'image/png',
      card: 'summary_large_image',
    });
  });
});
