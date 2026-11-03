import { NotFoundException } from '../common/http-errors';
import {
  ImageOptimizer,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import { readAll, resizedImageKey } from './s3-utils';
import { StorageService } from './storage.service';

export type ResizedImage = {
  readonly buffer: Buffer;
  readonly contentType: 'image/avif';
};

/**
 * Variante de largeur d'une image du bucket pour le `srcset`, dérivée à la première demande puis
 * conservée dans S3 sous `<key>.w<largeur>.avif`. Comme la carte de partage : `StorageService` la
 * jette quand l'original change, et les images déjà en ligne en profitent sans backfill.
 */
export class ResizedImageService {
  constructor(
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
  ) {}

  async get(
    bucket: string,
    key: string,
    width: ResponsiveImageWidth,
  ): Promise<ResizedImage> {
    const derivedKey = resizedImageKey(key, width);
    try {
      const cached = await this.storage.get(bucket, derivedKey);
      return {
        buffer: await readAll(cached.stream),
        contentType: 'image/avif',
      };
    } catch (err: unknown) {
      if (!(err instanceof NotFoundException)) throw err;
    }

    const original = await this.storage.get(bucket, key);
    const buffer = await this.images.toWidth(
      await readAll(original.stream),
      width,
    );
    await this.storage.upload(bucket, derivedKey, buffer, 'image/avif');
    return { buffer, contentType: 'image/avif' };
  }
}
