import { Hono } from 'hono';
import { getFile, buckets } from '../services/storage-client.js';

const images = new Hono();

// GET /images/projects/:key — proxy project image from S3
images.get('/projects/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const response = await getFile(buckets.projects.bucket, key);
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return c.json({ error: 'File not found' }, 404);
    }

    return new Response(Buffer.from(body), {
      headers: {
        'Content-Type': response.ContentType ?? 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

// GET /images/blog/:key — proxy article image from S3
images.get('/blog/:key', async (c) => {
  const key = c.req.param('key');

  try {
    const response = await getFile(buckets.blog.bucket, key);
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return c.json({ error: 'File not found' }, 404);
    }

    return new Response(Buffer.from(body), {
      headers: {
        'Content-Type': response.ContentType ?? 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

export default images;
