import { z } from 'zod';
import { PROJECT_IMAGE_ALT_MAX } from '../project-gallery';

/** Texte alternatif d'une capture : champ texte du multipart d'upload et corps du PATCH. */
export const projectImageAltSchema = z.strictObject({
  alt: z.string().trim().min(1).max(PROJECT_IMAGE_ALT_MAX),
});
export type ProjectImageAltDto = z.infer<typeof projectImageAltSchema>;
