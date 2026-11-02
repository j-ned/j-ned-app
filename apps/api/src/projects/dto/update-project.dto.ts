import { z } from 'zod';
import { createProjectSchema } from './create-project.dto';

// `.partial()` : un champ peut être omis, jamais mis à null, sauf ceux qui l'acceptent déjà (liens,
// champs éditoriaux) et `image: null`, qui retire la couverture.
export const updateProjectSchema = createProjectSchema.partial().extend({
  image: z.null().optional(),
});
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
