import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import {
  clientIp,
  jsonBody,
  queryParams,
  reply,
  uuidParam,
  type AppEnv,
} from '../common/http';
import { paginationSchema, parsePagination } from '../common/pagination';
import {
  CONTACT_THROTTLE,
  throttle,
  throttleSession,
} from '../common/throttle';
import type { ContactService } from './contact.service';
import { createContactMessageSchema } from './dto/create-contact-message.dto';

export function contactRoutes(
  contact: Pick<
    ContactService,
    'create' | 'findAll' | 'markAllRead' | 'markRead' | 'remove' | 'unreadCount'
  >,
  requireAuth: RequireAuth,
) {
  return (
    new Hono<AppEnv>()
      // Réponse identique, message enregistré ou écarté par le pot de miel.
      .post('/messages', throttle(CONTACT_THROTTLE), async (c) => {
        const dto = await jsonBody(c, createContactMessageSchema);
        await contact.create(dto, {
          ip: clientIp(c),
          userAgent: c.req.header('user-agent') ?? '',
        });
        return c.body(null, 201);
      })

      // Paginé, du plus récent au plus ancien.
      .get('/messages', throttleSession(requireAuth), async (c) => {
        const query = queryParams(c, paginationSchema);
        return reply(c, await contact.findAll(parsePagination(query)));
      })

      .get('/messages/unread-count', throttleSession(requireAuth), async (c) =>
        reply(c, await contact.unreadCount()),
      )

      .patch('/messages/mark-all-read', throttle(), requireAuth, async (c) =>
        reply(c, await contact.markAllRead()),
      )

      .patch('/messages/:id/read', throttle(), requireAuth, async (c) =>
        reply(c, await contact.markRead(uuidParam(c, 'id'))),
      )

      .delete('/messages/:id', throttle(), requireAuth, async (c) => {
        await contact.remove(uuidParam(c, 'id'));
        return c.body(null, 204);
      })
  );
}
