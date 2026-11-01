import { Hono } from 'hono';
import { Readable } from 'node:stream';
import type { AppEnv } from '../common/http';
import { BadRequestException, NotFoundException } from '../common/http-errors';
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

/**
 * `/api/storage/:bucket/<clé>` : relais public des objets S3, `?variant=share` pour la carte de
 * partage JPEG 1200×630 (og:image) générée à la première demande. Sans quota : une page référence
 * N images, le cache HTTP (un an, immutable) absorbe les répétitions.
 */
export function storageRoutes(
  storage: StorageService,
  shareCards: ShareCardService,
) {
  return new Hono<AppEnv>().get('/:bucket/*', async (c) => {
    const bucket = c.req.param('bucket');
    if (!PUBLIC_BUCKETS.has(bucket)) throw new NotFoundException();
    const key = c.req.path
      .split('/')
      .slice(c.req.path.split('/').indexOf(bucket) + 1)
      .map((segment) => decodeURIComponent(segment))
      .join('/');
    if (!key) throw new NotFoundException();

    const variant = c.req.query('variant');
    if (variant === 'share') {
      const { buffer, contentType } = await shareCards.get(bucket, key);
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
