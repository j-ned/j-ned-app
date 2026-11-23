import { Hono, type Context } from 'hono';
import { Readable } from 'node:stream';
import type { AppEnv } from '../common/http';
import { BadRequestException, NotFoundException } from '../common/http-errors';
import type { DerivedImage } from './derived-image';
import {
  RESPONSIVE_IMAGE_WIDTHS,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import type { ResizedImageService } from './resized-image.service';
import { isDerivedKey } from './s3-utils';
import type { ShareCardService } from './share-card.service';
import { STORAGE_BUCKET, type StorageService } from './storage.service';

// Les clés portent un hachage du contenu (`<id>-<sha8>.avif`, et sa carte `.share.jpg` en dérive) :
// une image remplacée change d'URL, celle-ci peut donc être gardée un an sans revalidation.
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

// Liste blanche : un éventuel bucket privé n'est pas exposé à qui connaîtrait son nom.
const PUBLIC_BUCKETS = new Set<string>([STORAGE_BUCKET]);

// Seulement pour une largeur de la liste fermée.
function widthVariant(variant: string): ResponsiveImageWidth | null {
  return (
    RESPONSIVE_IMAGE_WIDTHS.find((width) => variant === `w${width}`) ?? null
  );
}

// `null` si un segment porte un pourcent-encodage invalide (`%E0`).
function decodedKey(path: string, bucket: string): string | null {
  const segments = path.split('/');
  try {
    return segments
      .slice(segments.indexOf(bucket) + 1)
      .map((segment) => decodeURIComponent(segment))
      .join('/');
  } catch (error: unknown) {
    if (error instanceof URIError) return null;
    throw error;
  }
}

function derivedImageResponse(
  c: Context<AppEnv>,
  { buffer, contentType }: DerivedImage<string>,
) {
  return c.body(new Uint8Array(buffer), 200, {
    'Content-Type': contentType,
    'Content-Length': buffer.length.toString(),
    'Cache-Control': CACHE_CONTROL,
  });
}

// Sans quota : une page référence N images, le cache HTTP (un an, immutable) absorbe les répétitions
// et la liste fermée des largeurs borne ce qu'on peut dériver.
export function storageRoutes(
  storage: Pick<StorageService, 'get'>,
  shareCards: Pick<ShareCardService, 'get'>,
  resizedImages: Pick<ResizedImageService, 'get'>,
) {
  return new Hono<AppEnv>().get('/:bucket/*', async (c) => {
    const bucket = c.req.param('bucket');
    if (!PUBLIC_BUCKETS.has(bucket)) throw new NotFoundException();
    const key = decodedKey(c.req.path, bucket);
    if (!key) throw new NotFoundException();

    const variant = c.req.query('variant');
    // Une dérivée de dérivée ne serait jamais jetée avec l'original : elle s'accumulerait dans S3.
    if (variant !== undefined && isDerivedKey(key)) {
      throw new NotFoundException();
    }
    if (variant === 'share') {
      return derivedImageResponse(c, await shareCards.get(bucket, key));
    }
    const width = variant === undefined ? null : widthVariant(variant);
    if (width !== null) {
      return derivedImageResponse(
        c,
        await resizedImages.get(bucket, key, width),
      );
    }
    if (variant !== undefined) {
      throw new BadRequestException(`Unknown variant "${variant}"`);
    }

    const { stream, contentType, contentLength } = await storage.get(
      bucket,
      key,
    );
    return c.body(Readable.toWeb(stream) as ReadableStream<Uint8Array>, 200, {
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
      'Cache-Control': CACHE_CONTROL,
    });
  });
}
