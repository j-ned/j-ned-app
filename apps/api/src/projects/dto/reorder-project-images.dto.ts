import { z } from 'zod';
import { PROJECT_GALLERY_MAX } from '../project-gallery';

/** Ordre complet de la galerie : la permutation exacte est vérifiée par le service (422). */
export const reorderProjectImagesSchema = z.strictObject({
  imageIds: z
    .array(z.uuid())
    .max(PROJECT_GALLERY_MAX)
    .refine((ids) => new Set(ids).size === ids.length, {
      error: 'Les identifiants doivent être uniques',
    }),
});
export type ReorderProjectImagesDto = z.infer<
  typeof reorderProjectImagesSchema
>;
