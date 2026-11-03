import { IMAGE_CONFIG, IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import type { Provider } from '@angular/core';

/**
 * Largeurs que l'API dérive à la demande (`?variant=w<largeur>`), alignées sur
 * `RESPONSIVE_IMAGE_WIDTHS` côté API (`image-optimizer.service.ts`) ; l'original stocké fait 1600 px.
 */
const RESPONSIVE_IMAGE_WIDTHS = [480, 800, 1200] as const;
const STORED_IMAGE_WIDTH = 1600;

/** Image servie par le relais S3 de l'API, toujours normalisée en AVIF ≤ 1600 px à l'envoi. */
const STORED_AVIF = /^\/api\/storage\/portfolio-storage\/[^?#]+\.avif$/;

/**
 * Loader de `NgOptimizedImage` : une image stockée prend la plus petite variante au moins aussi
 * large que demandé (jamais une image floue), l'original au-delà. Toute autre URL reste telle quelle.
 */
export const storageImageLoader = ({ src, width }: ImageLoaderConfig): string => {
  if (width === undefined || !STORED_AVIF.test(src)) return src;
  const variant = RESPONSIVE_IMAGE_WIDTHS.find((candidate) => candidate >= width);
  return variant === undefined ? src : `${src}?variant=w${variant}`;
};

/** Les points de rupture du `srcset` sont exactement les variantes disponibles, plus l'original. */
export const provideStorageImages = (): Provider[] => [
  { provide: IMAGE_LOADER, useValue: storageImageLoader },
  {
    provide: IMAGE_CONFIG,
    useValue: { breakpoints: [...RESPONSIVE_IMAGE_WIDTHS, STORED_IMAGE_WIDTH] },
  },
];
