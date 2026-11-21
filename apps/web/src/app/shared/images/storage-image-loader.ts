import { IMAGE_CONFIG, IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import type { Provider } from '@angular/core';

// À garder alignées sur `RESPONSIVE_IMAGE_WIDTHS` de l'API (`image-optimizer.service.ts`).
const RESPONSIVE_IMAGE_WIDTHS = [480, 800, 1200] as const;
const STORED_IMAGE_WIDTH = 1600;

const STORED_AVIF = /^\/api\/storage\/portfolio-storage\/[^?#]+\.avif$/;

// Plus petite variante au moins aussi large que demandé : jamais une image floue.
export const storageImageLoader = ({ src, width }: ImageLoaderConfig): string => {
  if (width === undefined || !STORED_AVIF.test(src)) return src;
  const variant = RESPONSIVE_IMAGE_WIDTHS.find((candidate) => candidate >= width);
  return variant === undefined ? src : `${src}?variant=w${variant}`;
};

export const provideStorageImages = (): Provider[] => [
  { provide: IMAGE_LOADER, useValue: storageImageLoader },
  {
    provide: IMAGE_CONFIG,
    useValue: { breakpoints: [...RESPONSIVE_IMAGE_WIDTHS, STORED_IMAGE_WIDTH] },
  },
];
