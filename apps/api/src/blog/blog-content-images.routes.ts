import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import {
  reply,
  uploadedFile,
  type AppEnv,
  UPLOAD_MAX_BYTES,
} from '../common/http';
import { ADMIN_WRITE_THROTTLE, throttle } from '../common/throttle';
import type { BlogContentImagesService } from './blog-content-images.service';

/** Images d'article : 4 Mo au plus, WebP, JPEG, PNG ou AVIF (vérifié sur les octets). */
export const BLOG_IMAGE_UPLOAD = {
  maxBytes: UPLOAD_MAX_BYTES,
  fileType: /^image\/(webp|jpeg|png|avif)$/,
} as const;

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
      const file = await uploadedFile(c, BLOG_IMAGE_UPLOAD);
      return reply(c, await images.upload(file), 201);
    },
  );
}
