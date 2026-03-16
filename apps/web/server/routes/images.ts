import { Hono } from 'hono';
import sharp from 'sharp';
import { getFile, buckets } from '../services/storage-client.js';

const images = new Hono();

/** Max width for optimized images (covers 2x retina at ~800px display) */
const MAX_WIDTH = 1600;

/**
 * Optimize image: convert to WebP and resize if larger than MAX_WIDTH.
 * Returns the original buffer untouched for already-small or AVIF images.
 */
async function optimizeImage(
  body: Uint8Array,
  contentType: string | undefined,
  queryWidth?: number,
): Promise<{ buffer: Buffer; contentType: string }> {
  // Already AVIF — don't re-encode (would be larger)
  if (contentType?.includes('avif')) {
    return { buffer: Buffer.from(body), contentType: 'image/avif' };
  }

  const width = queryWidth ?? MAX_WIDTH;

  const optimized = await sharp(Buffer.from(body))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  return { buffer: optimized, contentType: 'image/webp' };
}

// GET /images/projects/:key — proxy + optimize project image from S3
images.get('/projects/:key', async (c) => {
  const key = c.req.param('key');
  const queryWidth = c.req.query('w') ? parseInt(c.req.query('w')!, 10) : undefined;

  try {
    const response = await getFile(buckets.projects.bucket, key);
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return c.json({ error: 'File not found' }, 404);
    }

    const { buffer, contentType } = await optimizeImage(body, response.ContentType, queryWidth);

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Vary': 'Accept',
      },
    });
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

// GET /images/blog/:key — proxy + optimize article image from S3
images.get('/blog/:key', async (c) => {
  const key = c.req.param('key');
  const queryWidth = c.req.query('w') ? parseInt(c.req.query('w')!, 10) : undefined;

  try {
    const response = await getFile(buckets.blog.bucket, key);
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return c.json({ error: 'File not found' }, 404);
    }

    const { buffer, contentType } = await optimizeImage(body, response.ContentType, queryWidth);

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Vary': 'Accept',
      },
    });
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

export default images;
