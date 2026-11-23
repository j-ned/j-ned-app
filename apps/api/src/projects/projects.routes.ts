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
import {
  ADMIN_WRITE_THROTTLE,
  PUBLIC_READ_THROTTLE,
  throttle,
} from '../common/throttle';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  entityTag,
  ifMatchVersion,
  replyVersioned,
} from '../common/entity-version';
import type { GalleryWrite } from './project-gallery';
import { validateDto } from '../common/validation';
import { createProjectSchema } from './dto/create-project.dto';
import { projectImageAltSchema } from './dto/project-image-alt.dto';
import { reorderProjectImagesSchema } from './dto/reorder-project-images.dto';
import { updateProjectSchema } from './dto/update-project.dto';
import type { ProjectImagesService } from './project-images.service';
import type { ProjectsService } from './projects.service';

// La galerie n'a que des écritures admin : sa lecture passe par `GET /projects`.
export function projectsRoutes(
  projects: Pick<
    ProjectsService,
    'findAll' | 'findById' | 'create' | 'update' | 'remove' | 'uploadImage'
  >,
  images: Pick<
    ProjectImagesService,
    'upload' | 'reorder' | 'updateAlt' | 'remove'
  >,
  requireAuth: RequireAuth,
): Hono<AppEnv> {
  return (
    new Hono<AppEnv>()
      .get('/', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await projects.findAll()),
      )

      .get('/:id', throttle(PUBLIC_READ_THROTTLE), async (c) =>
        replyVersioned(c, await projects.findById(uuidParam(c, 'id'))),
      )

      // 409 si le slug existe déjà.
      .post('/', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, createProjectSchema);
        return replyVersioned(c, await projects.create(dto), 201);
      })

      // `image: null` retire la couverture (et l'objet S3) ; `If-Match: "<version>"` rend l'écriture
      // conditionnelle.
      .patch('/:id', throttle(), requireAuth, async (c) => {
        const id = uuidParam(c, 'id');
        const expected = ifMatchVersion(c);
        const dto = await jsonBody(c, updateProjectSchema);
        return replyVersioned(c, await projects.update(id, dto, expected));
      })

      // Supprime aussi la couverture S3.
      .delete('/:id', throttle(), requireAuth, async (c) => {
        await projects.remove(uuidParam(c, 'id'));
        return c.body(null, 204);
      })

      // Couverture : stockée en AVIF ≤ 1600 px.
      .post('/:id/image', throttle(), requireAuth, async (c) => {
        const expected = ifMatchVersion(c);
        const { id, file } = await uuidParamAndFile(c, 'id', IMAGE_UPLOAD);
        return replyVersioned(
          c,
          await projects.uploadImage(id, file, expected),
          201,
        );
      })

      // Galerie : ajout d'une capture (champ `file` + champ texte `alt`).
      .post(
        '/:id/images',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const fields = c.req.raw.clone();
          const { id, file } = await uuidParamAndFile(c, 'id', IMAGE_UPLOAD);
          const dto = validateDto(
            projectImageAltSchema,
            await multipartFields(fields),
          );
          return replyGalleryWrite(
            c,
            await images.upload(id, file, dto.alt),
            201,
          );
        },
      )

      // `imageIds` : tous les ids de la galerie, dans le nouvel ordre ; renvoie la galerie triée.
      .put(
        '/:id/images/order',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const dto = await jsonBody(c, reorderProjectImagesSchema);
          return replyGalleryWrite(c, await images.reorder(id, dto.imageIds));
        },
      )

      .patch(
        '/:id/images/:imageId',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const imageId = uuidParam(c, 'imageId');
          const dto = await jsonBody(c, projectImageAltSchema);
          return replyGalleryWrite(
            c,
            await images.updateAlt(id, imageId, dto.alt),
          );
        },
      )

      .delete(
        '/:id/images/:imageId',
        throttle(ADMIN_WRITE_THROTTLE),
        requireAuth,
        async (c) => {
          const id = uuidParam(c, 'id');
          const imageId = uuidParam(c, 'imageId');
          const { projectVersion } = await images.remove(id, imageId);
          c.header('ETag', entityTag(projectVersion));
          return c.body(null, 204);
        },
      )
  );
}

// La galerie fait partie du projet : l'`ETag` d'une écriture de galerie est la version du projet.
function replyGalleryWrite<T>(
  c: Context,
  write: GalleryWrite<T>,
  status: ContentfulStatusCode = 200,
): Response {
  c.header('ETag', entityTag(write.projectVersion));
  return reply(c, write.result, status);
}

// Comme le `req.body` de multer : une clé répétée donne une liste.
async function multipartFields(
  request: Request,
): Promise<Record<string, string | string[]>> {
  const form = await request.formData();
  const fields: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    const values = form
      .getAll(key)
      .filter((value): value is string => typeof value === 'string');
    const [first, ...others] = values;
    if (first !== undefined) fields[key] = others.length === 0 ? first : values;
  }
  return fields;
}
