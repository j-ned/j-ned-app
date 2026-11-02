import { z } from 'zod';
import { PROFILE_LIMITS } from '../profile-limits';
import {
  profileBiographySchema,
  profileDiplomaSchema,
  profileHighlightSchema,
  profileMotivationSchema,
  profileTechnologySchema,
  profileWhatIDoSchema,
} from './profile-items.dto';
import { profileText } from './profile-text';

const L = PROFILE_LIMITS;

/** Liste ordonnée d'éléments à `id` : 1 à `max` éléments, `id` uniques, chacun validé. */
const profileItemList = <T extends { id: string }>(
  max: number,
  item: z.ZodType<T>,
) =>
  z
    .array(item)
    .min(1)
    .max(max)
    .refine(
      (items) => new Set(items.map(({ id }) => id)).size === items.length,
      {
        error: 'Les identifiants doivent être uniques',
      },
    );

/**
 * Remplacement complet du parcours (ADR-0023 §2) : les huit clés de contenu et la `version` lue.
 * L'ordre des listes est l'ordre d'affichage.
 */
export const updateProfileSchema = z.strictObject({
  version: z.int().min(1),
  biography: profileBiographySchema,
  highlights: profileItemList(L.highlight.items, profileHighlightSchema),
  workSummary: profileText(L.sectionSummary),
  whatIDo: profileItemList(L.whatIDo.items, profileWhatIDoSchema),
  technologies: profileItemList(L.technology.items, profileTechnologySchema),
  diplomasSummary: profileText(L.sectionSummary),
  diplomas: profileItemList(L.diploma.items, profileDiplomaSchema),
  motivation: profileMotivationSchema,
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
