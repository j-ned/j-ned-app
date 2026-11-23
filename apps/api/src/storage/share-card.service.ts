import {
  getOrDerive,
  type DerivedImage,
  type DerivedImageStorage,
} from './derived-image';
import { ImageOptimizer } from './image-optimizer.service';
import { shareCardKey } from './s3-utils';

export type ShareCard = DerivedImage<'image/jpeg'>;

// Conservée dans S3 sous `<key>.share.jpg`.
export class ShareCardService {
  constructor(
    private readonly storage: DerivedImageStorage,
    private readonly images: Pick<ImageOptimizer, 'toShareCard'>,
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
