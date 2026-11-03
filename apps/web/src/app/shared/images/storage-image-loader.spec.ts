import { storageImageLoader } from './storage-image-loader';

const STORED = '/api/storage/portfolio-storage/projects/81239d51-63c6552a.avif';

describe('storageImageLoader', () => {
  it.each([
    [480, `${STORED}?variant=w480`],
    [800, `${STORED}?variant=w800`],
    [1200, `${STORED}?variant=w1200`],
  ])(
    'Given a stored image and the %d px breakpoint When loaded Then the matching API variant is requested',
    (width, expected) => {
      expect(storageImageLoader({ src: STORED, width })).toBe(expected);
    },
  );

  it.each([
    [1, `${STORED}?variant=w480`],
    [481, `${STORED}?variant=w800`],
    [1199, `${STORED}?variant=w1200`],
  ])(
    'Given a width between variants (%d px) When loaded Then the next wider variant is requested, never a blurry one',
    (width, expected) => {
      expect(storageImageLoader({ src: STORED, width })).toBe(expected);
    },
  );

  it.each([1201, 1600, 3840, undefined])(
    'Given a width of %s beyond the widest variant When loaded Then the 1600 px original is served',
    (width) => {
      expect(storageImageLoader({ src: STORED, width })).toBe(STORED);
    },
  );

  it.each([
    '/favicon.svg',
    '/images/portrait.avif',
    'https://example.com/storage/portfolio-storage/x.avif',
    '/api/storage/portfolio-storage/cv/cv.pdf',
    `${STORED}?variant=share`,
  ])('Given %s, not a stored AVIF, When loaded Then its URL is left untouched', (src) => {
    expect(storageImageLoader({ src, width: 800 })).toBe(src);
  });
});
