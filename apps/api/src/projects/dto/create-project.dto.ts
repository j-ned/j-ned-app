import * as z from 'zod';
import { PROJECT_KINDS } from '../../database/schema/projects';
import { PROJECT_FACT_MAX, PROJECT_PITCH_MAX } from '../project-editorial';
import { architectureDecisionSchema } from './architecture-decision.dto';
import { techChoiceSchema } from './tech-choice.dto';

/**
 * Champ éditorial facultatif (ADR-0010 §3) : trim, vide → null, null efface, borne après trim.
 * Absent : reste `undefined` (colonne NULL à l'insert, clé hors du SET d'un UPDATE).
 */
const editorialText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((text) => text || null)
    .nullish();

/** Lien http(s) facultatif : `null` efface. */
const optionalUrl = () => z.url({ protocol: /^https?$/ }).nullish();

export const createProjectSchema = z.strictObject({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  tags: z.array(z.string().max(50)).max(20).optional(),
  description: z.string().min(1).max(5000),
  pitch: editorialText(PROJECT_PITCH_MAX),
  highlight: editorialText(PROJECT_FACT_MAX),
  scope: editorialText(PROJECT_FACT_MAX),
  liveUrl: optionalUrl(),
  repoUrl: optionalUrl(),
  repoUrlFront: optionalUrl(),
  repoUrlBack: optionalUrl(),
  techChoices: z.array(techChoiceSchema).max(30).optional(),
  architectureDecisions: z.array(architectureDecisionSchema).max(30).optional(),
  // Optionnel mais jamais null : la colonne est NOT NULL (ADR-0008 §4).
  kind: z.enum(PROJECT_KINDS).optional(),
  featured: z.boolean().optional(),
  order: z.int().min(0).optional(),
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;
