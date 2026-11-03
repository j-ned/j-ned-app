import { NotFoundException } from '../common/http-errors';
import { ImageOptimizer } from './image-optimizer.service';
import { readAll, shareCardKey } from './s3-utils';
import { StorageService } from './storage.service';

export type ShareCard = {
  readonly buffer: Buffer;
  readonly contentType: 'image/jpeg';
};

/**
 * Carte de partage d'une image du bucket, dérivée à la première demande puis conservée dans S3
 * sous `<key>.share.jpg`. `StorageService` supprime cette dérivée dès que l'original est remplacé
 * ou effacé : pas de backfill, pas de colonne en base, les images déjà en ligne en profitent.
 */
export class ShareCardService {
  constructor(
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
  ) {}

  async get(bucket: string, key: string): Promise<ShareCard> {
    const derivedKey = shareCardKey(key);
    try {
      const cached = await this.storage.get(bucket, derivedKey);
      return {
        buffer: await readAll(cached.stream),
        contentType: 'image/jpeg',
      };
    } catch (err: unknown) {
      if (!(err instanceof NotFoundException)) throw err;
    }

    const original = await this.storage.get(bucket, key);
    const buffer = await this.images.toShareCard(
      await readAll(original.stream),
    );
    await this.storage.upload(bucket, derivedKey, buffer, 'image/jpeg');
    return { buffer, contentType: 'image/jpeg' };
  }
}
