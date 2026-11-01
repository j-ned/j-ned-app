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
import { PaginationDto, parsePagination } from '../common/pagination';
import { CONTACT_THROTTLE, throttle } from '../common/throttle';
import type { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

/** `/api/contact` : envoi public d'un message, boîte de réception de l'admin. */
export function contactRoutes(
  contact: ContactService,
  requireAuth: RequireAuth,
) {
  return (
    new Hono<AppEnv>()
      // Réponse identique, message enregistré ou écarté par le pot de miel.
      .post('/messages', throttle(CONTACT_THROTTLE), async (c) => {
        const dto = await jsonBody(c, CreateContactMessageDto);
        await contact.create(dto, {
          ip: clientIp(c),
          userAgent: c.req.header('user-agent') ?? '',
        });
        return c.body(null, 201);
      })

      // Paginé, du plus récent au plus ancien.
      .get('/messages', throttle(), requireAuth, async (c) => {
        const query = await queryParams(c, PaginationDto);
        return reply(c, await contact.findAll(parsePagination(query)));
      })

      .get('/messages/unread-count', throttle(), requireAuth, async (c) =>
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
