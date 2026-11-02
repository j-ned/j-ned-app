import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import { jsonBody, reply, type AppEnv } from '../common/http';
import { PUBLIC_READ_THROTTLE, throttle } from '../common/throttle';
import { updateWorkshopGuideSchema } from './dto/update-workshop-guide.dto';
import type { WorkshopGuideService } from './workshop-guide.service';

/** `/api/workshop-guide` : guide des plaquettes, lecture publique et remplacement (admin). */
export function workshopGuideRoutes(
  guide: WorkshopGuideService,
  requireAuth: RequireAuth,
): Hono<AppEnv> {
  return (
    new Hono<AppEnv>()
      // Sans document enregistré : désactivé, décodeur éteint, aucune ligne, version 0.
      .get('/', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await guide.findCurrent()),
      )

      // Remplacement complet ; `decoderEnabled` absent conserve la valeur stockée, 409 si périmé.
      .put('/', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, updateWorkshopGuideSchema);
        return reply(c, await guide.replace(dto));
      })
  );
}
