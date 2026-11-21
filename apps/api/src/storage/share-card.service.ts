import { getOrDerive, type DerivedImage } from './derived-image';
import { ImageOptimizer } from './image-optimizer.service';
import { shareCardKey } from './s3-utils';
import { StorageService } from './storage.service';

export type ShareCard = DerivedImage<'image/jpeg'>;

/** Carte de partage d'une image du bucket, conservée dans S3 sous `<key>.share.jpg`. */
export class ShareCardService {
  constructor(
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
  ) {}

  get(bucket: string, key: string): Promise<ShareCard> {
    return getOrDerive(
      this.storage,
      bucket,
      key,
      { key: shareCardKey(key), contentType: 'image/jpeg' },
      (original) => this.images.toShareCard(original),
    );
  }
}
