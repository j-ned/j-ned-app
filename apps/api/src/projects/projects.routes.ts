import type { Context } from 'hono';
import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import {
  jsonBody,
  reply,
  uploadedFile,
  uuidParam,
  type AppEnv,
  type UploadedFile,
  UPLOAD_MAX_BYTES,
} from '../common/http';
import { PayloadTooLargeException } from '../common/http-errors';
import {
  ADMIN_WRITE_THROTTLE,
  PUBLIC_READ_THROTTLE,
  throttle,
} from '../common/throttle';
import { validateDto } from '../common/validation';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectImageAltDto } from './dto/project-image-alt.dto';
import { ReorderProjectImagesDto } from './dto/reorder-project-images.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectImagesService } from './project-images.service';
import type { ProjectsService } from './projects.service';

/** Image de couverture ou de galerie : 4 Mo au plus, WebP/JPEG/PNG/AVIF (vérifié sur les octets). */
export const PROJECT_IMAGE_UPLOAD = {
  maxBytes: UPLOAD_MAX_BYTES,
  fileType: /^image\/(webp|jpeg|png|avif)$/,
} as const;

/**
 * `/api/projects` : lecture publique des projets, écritures admin (projet, couverture) et galerie
 * d'un projet (ADR-0009, écritures admin seulement ; la lecture passe par `GET /projects`).
 */
export function projectsRoutes(
  projects: ProjectsService,
  images: ProjectImagesService,
  requireAuth: RequireAuth,
): Hono<AppEnv> {
  return (
    new Hono<AppEnv>()
      // Liste publique, filtrable par catégorie et `featured=true`.
      .get('/', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(
          c,
          await projects.findAll({
            category: c.req.query('category'),
            featured: c.req.query('featured') === 'true',
          }),
        ),
      )

      .get('/:id', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await projects.findById(uuidParam(c, 'id'))),
      )

      // 409 si le slug existe déjà.
      .post('/', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, CreateProjectDto);
        return reply(c, await projects.create(dto), 201);
      })

      // `image: null` retire la couverture (et l'objet S3).
      .patch('/:id', throttle(), requireAuth, async (c) => {
        const id = uuidParam(c, 'id');
        const dto = await jsonBody(c, UpdateProjectDto);
        return reply(c, await projects.update(id, dto));
      })

      // Supprime aussi la couverture S3.
      .delete('/:id', throttle(), requireAuth, async (c) => {
        await projects.remove(uuidParam(c, 'id'));
        return c.body(null, 204);
      })

      // Couverture : stockée en AVIF ≤ 1600 px.
      .post('/:id/image', throttle(), requireAuth, async (c) => {
        const { id, file } = await projectIdAndImage(c);
        return reply(c, await projects.uploadImage(id, file), 201);
      })

      // Galerie : ajout d'une capture (champ `file` + champ texte `alt`).
      .post(
        '/:id/images',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const fields = c.req.raw.clone();
          const { id, file } = await projectIdAndImage(c);
          const dto = await validateDto(
            ProjectImageAltDto,
            await multipartFields(fields),
          );
          return reply(c, await images.upload(id, file, dto.alt), 201);
        },
      )

      // `imageIds` : tous les ids de la galerie, dans le nouvel ordre ; renvoie la galerie triée.
      .put(
        '/:id/images/order',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const dto = await jsonBody(c, ReorderProjectImagesDto);
          return reply(c, await images.reorder(id, dto.imageIds));
        },
      )

      .patch(
        '/:id/images/:imageId',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const imageId = uuidParam(c, 'imageId');
          const dto = await jsonBody(c, ProjectImageAltDto);
          return reply(c, await images.updateAlt(id, imageId, dto.alt));
        },
      )

      .delete(
        '/:id/images/:imageId',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const imageId = uuidParam(c, 'imageId');
          await images.remove(id, imageId);
          return c.body(null, 204);
        },
      )
  );
}

/**
 * Id du projet et fichier envoyé, dans l'ordre de l'API NestJS : la limite de taille de multer
 * (413) passe avant l'UUID du chemin (400), qui passe avant la validation du fichier (422).
 */
async function projectIdAndImage(
  c: Context<AppEnv>,
): Promise<{ id: string; file: UploadedFile }> {
  let id = '';
  let invalidId: Error | undefined;
  try {
    id = uuidParam(c, 'id');
  } catch (error) {
    invalidId = error as Error;
  }
  let file: UploadedFile;
  try {
    file = await uploadedFile(c, PROJECT_IMAGE_UPLOAD);
  } catch (error) {
    if (invalidId && !(error instanceof PayloadTooLargeException)) {
      throw invalidId;
    }
    throw error;
  }
  if (invalidId) throw invalidId;
  return { id, file };
}

/** Champs texte du multipart (le `req.body` de multer) : une clé répétée donne une liste. */
async function multipartFields(
  request: Request,
): Promise<Record<string, string | string[]>> {
  const form = await request.formData();
  const fields: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    const values = form
      .getAll(key)
      .filter((value): value is string => typeof value === 'string');
    if (values.length > 0)
      fields[key] = values.length === 1 ? values[0] : values;
  }
  return fields;
}
