import type { DemoImageFile } from './models/offer.model';

export const DEMO_IMAGE_WIDTHS = [800, 1600] as const;

const [, FALLBACK_WIDTH] = DEMO_IMAGE_WIDTHS;
const FALLBACK_HEIGHT = (FALLBACK_WIDTH / 16) * 10;

type DemoPicture = {
  readonly avifSrcset: string;
  readonly webpSrcset: string;
  readonly fallbackSrc: string;
  readonly width: number;
  readonly height: number;
};

const srcsetOf = (file: DemoImageFile, extension: 'avif' | 'webp'): string =>
  DEMO_IMAGE_WIDTHS.map((width) => `${file}-${width}.${extension} ${width}w`).join(', ');

export function demoPicture(file: DemoImageFile): DemoPicture {
  return {
    avifSrcset: srcsetOf(file, 'avif'),
    webpSrcset: srcsetOf(file, 'webp'),
    fallbackSrc: `${file}-${FALLBACK_WIDTH}.webp`,
    width: FALLBACK_WIDTH,
    height: FALLBACK_HEIGHT,
  };
}
