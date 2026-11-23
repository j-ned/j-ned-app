import {
  getOrDerive,
  type DerivedImage,
  type DerivedImageStorage,
} from './derived-image';
import {
  ImageOptimizer,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import { resizedImageKey } from './s3-utils';

export type ResizedImage = DerivedImage<'image/avif'>;

// Conservée dans S3 sous `<key>.w<largeur>.avif`.
export class ResizedImageService {
  constructor(
    private readonly storage: DerivedImageStorage,
    private readonly images: Pick<ImageOptimizer, 'toWidth'>,
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
