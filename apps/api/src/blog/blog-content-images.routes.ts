import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import { IMAGE_UPLOAD, reply, uploadedFile, type AppEnv } from '../common/http';
import { ADMIN_WRITE_THROTTLE, throttle } from '../common/throttle';
import type { BlogContentImagesService } from './blog-content-images.service';

/**
 * `/api/blog/content-images` : images du corps des articles. Aucune ligne en base, le Markdown cite
 * l'URL renvoyée (stockée en AVIF ≤ 1 600 px, avec ses dimensions intrinsèques).
 */
export function blogContentImagesRoutes(
  images: BlogContentImagesService,
  requireAuth: RequireAuth,
) {
  return new Hono<AppEnv>().post(
    '/',
    throttle(ADMIN_WRITE_THROTTLE),
    requireAuth,
    async (c) => {
      const file = await uploadedFile(c, IMAGE_UPLOAD);
      return reply(c, await images.upload(file), 201);
    },
  );
}
