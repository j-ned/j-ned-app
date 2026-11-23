import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import { IMAGE_UPLOAD, reply, uploadedFile, type AppEnv } from '../common/http';
import { ADMIN_WRITE_THROTTLE, throttle } from '../common/throttle';
import type { BlogContentImagesService } from './blog-content-images.service';

export function blogContentImagesRoutes(
  images: Pick<BlogContentImagesService, 'upload'>,
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
