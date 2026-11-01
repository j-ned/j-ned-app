import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import { jsonBody, reply, uploadedFile, type AppEnv } from '../common/http';
import { PUBLIC_READ_THROTTLE, throttle } from '../common/throttle';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { ProfilePortraitService } from './profile-portrait.service';
import type { ProfileService } from './profile.service';

/** Portrait : 5 Mo au plus (au-delà, 413 avant tout stockage), image WebP, JPEG, PNG ou AVIF. */
export const PORTRAIT_UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  fileType: /^image\/(webp|jpeg|png|avif)$/,
} as const;

/** `/api/profile` : contenu de la page Parcours (lecture publique), édition et portrait (admin). */
export function profileRoutes(
  profile: ProfileService,
  portrait: ProfilePortraitService,
  requireAuth: RequireAuth,
): Hono<AppEnv> {
  return (
    new Hono<AppEnv>()
      // Lecture publique : 404 tant que le contenu n'est pas amorcé.
      .get('/', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await profile.findCurrent()),
      )

      // Remplacement complet ; 409 si la version lue a changé.
      .put('/', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, UpdateProfileDto);
        return reply(c, await profile.replace(dto));
      })

      // Stocké en AVIF 640×800 ; 422 si absent, d'un autre type ou illisible.
      .post('/portrait', throttle(), requireAuth, async (c) => {
        const file = await uploadedFile(c, PORTRAIT_UPLOAD);
        return reply(c, await portrait.replace(file));
      })

      // Retour au portrait par défaut.
      .delete('/portrait', throttle(), requireAuth, async (c) => {
        await portrait.remove();
        return c.body(null, 204);
      })
  );
}
