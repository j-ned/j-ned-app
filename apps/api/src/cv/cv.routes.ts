import { Hono } from 'hono';
import { Readable } from 'node:stream';
import type { RequireAuth } from '../auth/require-auth';
import { cdnCache } from '../common/cdn-cache';
import {
  reply,
  uploadedFile,
  type AppEnv,
  UPLOAD_MAX_BYTES,
} from '../common/http';
import { PUBLIC_READ_THROTTLE, throttle } from '../common/throttle';
import type { CvService } from './cv.service';

/** CV : 4 Mo au plus, PDF uniquement (vérifié sur les octets). */
const CV_UPLOAD = {
  maxBytes: UPLOAD_MAX_BYTES,
  fileType: /^application\/pdf$/,
} as const;

/** `/api/cv` : métadonnées et téléchargement publics, remplacement et suppression admin. */
export function cvRoutes(cv: CvService, requireAuth: RequireAuth) {
  return (
    new Hono<AppEnv>()
      // Ajoute ou remplace le CV.
      .post('/upload', throttle(), requireAuth, async (c) => {
        const file = await uploadedFile(c, CV_UPLOAD);
        return reply(c, await cv.upsert(file), 201);
      })

      // Métadonnées du CV, corps vide s'il n'y en a pas.
      .get('/', cdnCache, throttle(PUBLIC_READ_THROTTLE), async (c) =>
        reply(c, await cv.findLatestMetadata()),
      )

      // PDF en pièce jointe sous son nom d'origine, 404 sans CV.
      .get('/download', cdnCache, throttle(PUBLIC_READ_THROTTLE), async (c) => {
        const { stream, metadata } = await cv.download();
        return c.body(
          Readable.toWeb(stream) as ReadableStream<Uint8Array>,
          200,
          {
            'Content-Type': metadata.mimeType,
            'Content-Disposition': `attachment; filename="${metadata.fileName}"`,
            'Content-Length': metadata.fileSize.toString(),
          },
        );
      })

      .delete('/', throttle(), requireAuth, async (c) => {
        await cv.remove();
        return c.body(null, 204);
      })
  );
}
