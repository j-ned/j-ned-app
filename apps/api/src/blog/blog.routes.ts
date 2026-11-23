import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import {
  IMAGE_UPLOAD,
  jsonBody,
  reply,
  uuidParam,
  uuidParamAndFile,
  type AppEnv,
} from '../common/http';
import { ifMatchVersion, replyVersioned } from '../common/entity-version';
import {
  PUBLIC_READ_THROTTLE,
  throttle,
  throttleSession,
} from '../common/throttle';
import { blogCommentsRoutes } from '../blog-comments/blog-comments.routes';
import type { BlogCommentsService } from '../blog-comments/blog-comments.service';
import { blogContentImagesRoutes } from './blog-content-images.routes';
import type { BlogContentImagesService } from './blog-content-images.service';
import type { BlogService } from './blog.service';
import { createBlogPostSchema } from './dto/create-blog-post.dto';
import { updateBlogPostSchema } from './dto/update-blog-post.dto';

export function blogRoutes(
  blog: BlogService,
  contentImages: BlogContentImagesService,
  comments: BlogCommentsService,
  requireAuth: RequireAuth,
) {
  return new Hono<AppEnv>()
    .route('/posts', blogPostsRoutes(blog, requireAuth))
    .route(
      '/content-images',
      blogContentImagesRoutes(contentImages, requireAuth),
    )
    .route('/', blogCommentsRoutes(comments, requireAuth));
}

// Les chemins fixes (`/admin`) passent avant `/:slug`.
function blogPostsRoutes(blog: BlogService, requireAuth: RequireAuth) {
  return (
    new Hono<AppEnv>()
      // Articles publiés (public), sans leur corps : `?include=content` l'ajoute (flux RSS du site).
      .get('/', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(
          c,
          c.req.query('include') === 'content'
            ? await blog.findAllPublished()
            : await blog.findPublishedSummaries(),
        ),
      )

      // Tous les articles, brouillons compris, sans leur corps (admin).
      .get('/admin', throttleSession(requireAuth), async (c) =>
        reply(c, await blog.findAdminSummaries()),
      )

      // Un article, brouillon compris, avec son corps et sa version en `ETag` (admin).
      .get('/admin/:id', throttleSession(requireAuth), async (c) =>
        replyVersioned(c, await blog.findByIdForAdmin(uuidParam(c, 'id'))),
      )

      // Article publié par slug (public), 404 sinon.
      .get('/:slug', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        replyVersioned(c, await blog.findBySlug(c.req.param('slug'))),
      )

      // 409 si le slug existe déjà.
      .post('/', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, createBlogPostSchema);
        return replyVersioned(c, await blog.create(dto), 201);
      })

      // `coverImage: null` retire la couverture ; `If-Match: "<version>"` rend l'écriture conditionnelle.
      .patch('/:id', throttle(), requireAuth, async (c) => {
        const id = uuidParam(c, 'id');
        const expected = ifMatchVersion(c);
        const dto = await jsonBody(c, updateBlogPostSchema);
        return replyVersioned(c, await blog.update(id, dto, expected));
      })

      // Supprime aussi la couverture et les images du corps devenues orphelines.
      .delete('/:id', throttle(), requireAuth, async (c) => {
        await blog.remove(uuidParam(c, 'id'));
        return c.body(null, 204);
      })

      // Couverture (stockée en AVIF ≤ 1 600 px).
      .post('/:id/image', throttle(), requireAuth, async (c) => {
        const expected = ifMatchVersion(c);
        const { id, file } = await uuidParamAndFile(c, 'id', IMAGE_UPLOAD);
        return replyVersioned(
          c,
          await blog.uploadCoverImage(id, file, expected),
          201,
        );
      })

      // Compteur de likes (public, sans authentification).
      .post('/:slug/like', throttle(), async (c) =>
        reply(c, await blog.like(c.req.param('slug')), 201),
      )
  );
}
