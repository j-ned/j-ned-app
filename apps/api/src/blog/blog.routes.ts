import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import { cdnCache } from '../common/cdn-cache';
import {
  jsonBody,
  reply,
  uploadedFile,
  uuidParam,
  type AppEnv,
  type UploadedFile,
} from '../common/http';
import { PayloadTooLargeException } from '../common/http-errors';
import { PUBLIC_READ_THROTTLE, throttle } from '../common/throttle';
import {
  BLOG_IMAGE_UPLOAD,
  blogContentImagesRoutes,
} from './blog-content-images.routes';
import type { BlogContentImagesService } from './blog-content-images.service';
import type { BlogService } from './blog.service';
import { createBlogPostSchema } from './dto/create-blog-post.dto';
import { updateBlogPostSchema } from './dto/update-blog-post.dto';

/**
 * `/api/blog` : articles (`/posts`, lecture publique, écriture admin, like public) et images du corps
 * (`/content-images`, admin).
 */
export function blogRoutes(
  blog: BlogService,
  contentImages: BlogContentImagesService,
  requireAuth: RequireAuth,
) {
  return new Hono<AppEnv>()
    .route('/posts', blogPostsRoutes(blog, requireAuth))
    .route(
      '/content-images',
      blogContentImagesRoutes(contentImages, requireAuth),
    );
}

/** `/api/blog/posts`. Les chemins fixes (`/admin`) passent avant `/:slug`. */
export function blogPostsRoutes(blog: BlogService, requireAuth: RequireAuth) {
  return (
    new Hono<AppEnv>()
      // Articles publiés (public).
      .get('/', cdnCache, throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await blog.findAllPublished()),
      )

      // Tous les articles, brouillons compris (admin).
      .get('/admin', throttle(), requireAuth, async (c) =>
        reply(c, await blog.findAllForAdmin()),
      )

      // Article publié par slug (public), 404 sinon.
      .get('/:slug', cdnCache, throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await blog.findBySlug(c.req.param('slug'))),
      )

      // 409 si le slug existe déjà.
      .post('/', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, createBlogPostSchema);
        return reply(c, await blog.create(dto), 201);
      })

      // `coverImage: null` retire la couverture.
      .patch('/:id', throttle(), requireAuth, async (c) => {
        const id = uuidParam(c, 'id');
        const dto = await jsonBody(c, updateBlogPostSchema);
        return reply(c, await blog.update(id, dto));
      })

      // Supprime aussi la couverture et les images du corps devenues orphelines.
      .delete('/:id', throttle(), requireAuth, async (c) => {
        await blog.remove(uuidParam(c, 'id'));
        return c.body(null, 204);
      })

      // Couverture (stockée en AVIF ≤ 1 600 px).
      .post('/:id/image', throttle(), requireAuth, async (c) => {
        // Ordre de l’API d’origine : taille (413), puis id (400), puis fichier absent ou invalide (422).
        let file: UploadedFile | undefined;
        let fileError: unknown;
        try {
          file = await uploadedFile(c, BLOG_IMAGE_UPLOAD);
        } catch (error) {
          if (error instanceof PayloadTooLargeException) throw error;
          fileError = error;
        }
        const id = uuidParam(c, 'id');
        if (!file) throw fileError;
        return reply(c, await blog.uploadCoverImage(id, file), 201);
      })

      // Compteur de likes (public, sans authentification).
      .post('/:slug/like', throttle(), async (c) =>
        reply(c, await blog.like(c.req.param('slug')), 201),
      )
  );
}
