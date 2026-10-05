import { DEMO_IMAGE_WIDTHS, demoPicture } from './demo-picture';

describe('demoPicture', () => {
  it('derives the variants from the 800 and 1600 pixel widths, in that order', () => {
    expect(DEMO_IMAGE_WIDTHS).toEqual([800, 1600]);
  });

  it.each([
    {
      file: '/demos/site-industrie-20261005',
      avifSrcset:
        '/demos/site-industrie-20261005-800.avif 800w, /demos/site-industrie-20261005-1600.avif 1600w',
      webpSrcset:
        '/demos/site-industrie-20261005-800.webp 800w, /demos/site-industrie-20261005-1600.webp 1600w',
      fallbackSrc: '/demos/site-industrie-20261005-1600.webp',
    },
    {
      file: '/demos/coaching-life-20270312',
      avifSrcset:
        '/demos/coaching-life-20270312-800.avif 800w, /demos/coaching-life-20270312-1600.avif 1600w',
      webpSrcset:
        '/demos/coaching-life-20270312-800.webp 800w, /demos/coaching-life-20270312-1600.webp 1600w',
      fallbackSrc: '/demos/coaching-life-20270312-1600.webp',
    },
  ] as const)(
    'given $file, offers AVIF then WebP sources and falls back on the 1600 WebP of 1600 by 1000',
    ({ file, avifSrcset, webpSrcset, fallbackSrc }) => {
      expect(demoPicture(file)).toEqual({
        avifSrcset,
        webpSrcset,
        fallbackSrc,
        width: 1600,
        height: 1000,
      });
    },
  );
});
