import { getOrDerive, type DerivedImage } from './derived-image';
import {
  ImageOptimizer,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import { resizedImageKey } from './s3-utils';
import { StorageService } from './storage.service';

export type ResizedImage = DerivedImage<'image/avif'>;

/**
 * Variante de largeur d'une image du bucket pour le `srcset`, conservée dans S3 sous
 * `<key>.w<largeur>.avif`.
 */
export class ResizedImageService {
  constructor(
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
  ) {}

  get(
    bucket: string,
    key: string,
    width: ResponsiveImageWidth,
  ): Promise<ResizedImage> {
    return getOrDerive(
      this.storage,
      bucket,
      key,
      { key: resizedImageKey(key, width), contentType: 'image/avif' },
      (original) => this.images.toWidth(original, width),
    );
  }
}
