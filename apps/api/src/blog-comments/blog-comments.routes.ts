import { Hono } from 'hono';
import * as z from 'zod';
import type { RequireAuth } from '../auth/require-auth';
import {
  clientIp,
  jsonBody,
  queryParams,
  reply,
  uuidParam,
  type AppContext,
  type AppEnv,
} from '../common/http';
import { NotFoundException } from '../common/http-errors';
import { paginationSchema, parsePagination } from '../common/pagination';
import {
  ADMIN_WRITE_THROTTLE,
  PUBLIC_READ_THROTTLE,
  throttle,
} from '../common/throttle';
import { COMMENT_STATUSES } from '../database/schema';
import type { BlogCommentsService } from './blog-comments.service';
import { COMMENT_THROTTLE } from './comment-limits';
import {
  commentBodySchema,
  createCommentSchema,
} from './dto/create-comment.dto';
import { publicCommentPageSchema } from './public-comment';

// Forme produite par `slugify` : tout autre texte (octet NUL compris) n'atteint pas la base.
const slugSchema = z
  .string()
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const adminListSchema = paginationSchema.extend({
  status: z.enum(COMMENT_STATUSES).optional(),
});

const ownerReplySchema = z.strictObject({ body: commentBodySchema });

// Refuser un commentaire, c'est le supprimer : `DELETE /comments/:id`.
const moderateCommentSchema = z.strictObject({
  status: z.literal('published'),
});

// Un slug mal formé ne désigne aucun article : même 404 qu'un slug inconnu.
function slugParam(c: AppContext): string {
  const slug = slugSchema.safeParse(c.req.param('slug'));
  if (!slug.success) throw new NotFoundException('Article introuvable.');
  return slug.data;
}

// Sous `/api/blog` : `/posts/:slug/comments` (public) et `/comments` (modération, admin).
export function blogCommentsRoutes(
  comments: BlogCommentsService,
  requireAuth: RequireAuth,
) {
  return (
    new Hono<AppEnv>()
      // Commentaires publiés, du plus ancien au plus récent ; jamais d'e-mail (schéma de sortie).
      .get(
        '/posts/:slug/comments',
        throttle(PUBLIC_READ_THROTTLE),
        async (c) => {
          const slug = slugParam(c);
          const page = parsePagination(queryParams(c, paginationSchema));
          return reply(
            c,
            publicCommentPageSchema.parse(
              await comments.findPublished(slug, page),
            ),
          );
        },
      )

      // Même forme, commentaire enregistré ou écarté par le champ piège : `{ id }`.
      .post('/posts/:slug/comments', throttle(COMMENT_THROTTLE), async (c) => {
        const slug = slugParam(c);
        const dto = await jsonBody(c, createCommentSchema);
        return c.json(
          await comments.submit(slug, dto, { ip: clientIp(c) }),
          202,
        );
      })

      // Les chemins fixes (`/pending-count`) passent avant `/:id`.
      .get('/comments', throttle(), requireAuth, async (c) => {
        const { status, ...pagination } = queryParams(c, adminListSchema);
        return reply(
          c,
          await comments.findAllForAdmin(status, parsePagination(pagination)),
        );
      })

      .get('/comments/pending-count', throttle(), requireAuth, async (c) =>
        reply(c, await comments.pendingCount()),
      )

      // Une session de modération dépasse vite les 10 requêtes par minute du quota par défaut.
      .patch(
        '/comments/:id',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          await jsonBody(c, moderateCommentSchema);
          return reply(c, await comments.publish(id));
        },
      )

      // Refus ou suppression : le commentaire et ses réponses disparaissent.
      .delete(
        '/comments/:id',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          await comments.remove(uuidParam(c, 'id'));
          return c.body(null, 204);
        },
      )

      // Réponse du propriétaire à un commentaire publié, publiée immédiatement.
      .post(
        '/comments/:id/replies',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const { body } = await jsonBody(c, ownerReplySchema);
          return reply(c, await comments.reply(id, body), 201);
        },
      )
  );
}
