/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { DEFAULT_SHARE_IMAGE } from './shared/seo/share-image';

const parse = (path: string, type: DOMParserSupportedType): Document =>
  new DOMParser().parseFromString(readFileSync(path, 'utf8'), type);

describe('browser identity', () => {
  it('Given the static page When the browser reads its colour Then it gets the sand page in light and the night page in dark', () => {
    const metas = [
      ...parse('src/index.html', 'text/html').querySelectorAll('meta[name="theme-color"]'),
    ];

    expect(
      metas.map((meta) => ({
        media: meta.getAttribute('media'),
        content: meta.getAttribute('content'),
      })),
    ).toEqual([
      { media: '(prefers-color-scheme: light)', content: '#fcf4eb' },
      { media: '(prefers-color-scheme: dark)', content: '#141a29' },
    ]);
  });

  it('Given the favicon When it is drawn Then it is a flat orange tile with the dark « JN », the same in both themes', () => {
    const svg = parse('public/favicon.svg', 'image/svg+xml');
    const tile = svg.querySelector('rect');
    const monogram = svg.querySelector('text');

    expect({
      gradients: svg.querySelectorAll('linearGradient, radialGradient').length,
      styles: svg.querySelectorAll('style').length,
      tile: { rx: tile?.getAttribute('rx'), fill: tile?.getAttribute('fill') },
      monogram: { text: monogram?.textContent?.trim(), fill: monogram?.getAttribute('fill') },
    }).toEqual({
      gradients: 0,
      styles: 0,
      tile: { rx: '16', fill: '#ed6e12' },
      monogram: { text: 'JN', fill: '#181f2e' },
    });
  });

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
