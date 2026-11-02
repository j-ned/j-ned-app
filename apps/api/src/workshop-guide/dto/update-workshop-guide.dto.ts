import { z } from 'zod';
import { profileText, withoutMarkup } from '../../profile/dto/profile-text';
import { WORKSHOP_GUIDE_OPERATIONS } from '../workshop-guide-content';
import { WORKSHOP_GUIDE_LIMITS } from '../workshop-guide-limits';

const L = WORKSHOP_GUIDE_LIMITS;

const materialSchema = profileText(L.material);

/**
 * Ligne du guide. Une ligne « toutes matières » (`allMaterials: true`, spec 037) n'a pas de matière ;
 * sinon la matière est exigée. Rayon et remarque facultatifs (`null` ou absent ; une remarque vide
 * vaut « pas de remarque »).
 */
export const workshopGuideEntrySchema = z
  .strictObject({
    allMaterials: z.boolean().nullish(),
    material: z.string().nullish(),
    operation: z.enum(WORKSHOP_GUIDE_OPERATIONS),
    insert: profileText(L.insert),
    noseRadius: z
      .number()
      .positive()
      .max(L.noseRadius)
      .multipleOf(10 ** -L.noseRadiusDecimals)
      .nullish(),
    note: withoutMarkup(z.string().max(L.note)).nullish(),
  })
  .superRefine((entry, ctx) => {
    if (entry.allMaterials === true) return;
    const material = materialSchema.safeParse(entry.material);
    for (const issue of material.error?.issues ?? []) {
      ctx.addIssue({
        code: 'custom',
        path: ['material', ...issue.path],
        message: issue.message,
      });
    }
  });
export type WorkshopGuideEntryDto = z.infer<typeof workshopGuideEntrySchema>;

/**
 * Remplacement complet du guide des plaquettes (spec 035 du front) : l'interrupteur, les lignes et
 * la `version` lue. Version 0 = aucun document encore enregistré. `decoderEnabled` absent (admin
 * d'avant la spec 036) : la valeur enregistrée est conservée.
 */
export const updateWorkshopGuideSchema = z.strictObject({
  version: z.int().min(0),
  enabled: z.boolean(),
  decoderEnabled: z.boolean().optional(),
  entries: z.array(workshopGuideEntrySchema).max(L.entries),
});
export type UpdateWorkshopGuideDto = z.infer<typeof updateWorkshopGuideSchema>;
