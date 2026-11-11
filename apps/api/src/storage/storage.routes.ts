import { Hono } from 'hono';
import { Readable } from 'node:stream';
import type { AppEnv } from '../common/http';
import { BadRequestException, NotFoundException } from '../common/http-errors';
import {
  RESPONSIVE_IMAGE_WIDTHS,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import type { ResizedImageService } from './resized-image.service';
import { isDerivedKey } from './s3-utils';
import type { ShareCardService } from './share-card.service';
import type { StorageService } from './storage.service';

// Les clés portent un hachage du contenu (`<id>-<sha8>.avif`, et sa carte `.share.jpg` en dérive) :
// une image remplacée change d'URL, celle-ci peut donc être gardée un an sans revalidation.
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Whitelist des buckets servis publiquement via le proxy.
 * Évite qu'un éventuel bucket privé soit exposé par mégarde si quelqu'un
 * connaît son nom.
 */
const PUBLIC_BUCKETS = new Set<string>(['portfolio-storage']);

/** `w800` → 800, seulement pour une largeur de la liste fermée. */
function widthVariant(variant: string): ResponsiveImageWidth | null {
  return (
    RESPONSIVE_IMAGE_WIDTHS.find((width) => variant === `w${width}`) ?? null
  );
}

/**
 * `/api/storage/:bucket/<clé>` : relais public des objets S3, `?variant=share` pour la carte de
 * partage JPEG 1200×630 (og:image) et `?variant=w<largeur>` pour les variantes AVIF du `srcset`,
 * générées à la première demande. Sans quota : une page référence N images, le cache HTTP (un an,
 * immutable) absorbe les répétitions, et la liste fermée des largeurs borne ce qu'on peut dériver.
 */
/** Clé S3 demandée, ou `null` si un segment porte un pourcent-encodage invalide (`%E0`). */
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

export function storageRoutes(
  storage: StorageService,
  shareCards: ShareCardService,
  resizedImages: ResizedImageService,
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
      const { buffer, contentType } = await shareCards.get(bucket, key);
      return c.body(new Uint8Array(buffer), 200, {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': CACHE_CONTROL,
      });
    }
    const width = variant === undefined ? null : widthVariant(variant);
    if (width !== null) {
      const { buffer, contentType } = await resizedImages.get(
        bucket,
        key,
        width,
      );
      return c.body(new Uint8Array(buffer), 200, {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': CACHE_CONTROL,
      });
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
