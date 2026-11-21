import type { ProjectOutcome } from './models/project-outcome.model';
import { PROJECT_OUTCOMES } from './project-outcomes.static-data';

// Une Map ne répond jamais par une clé héritée (`constructor`, `toString`) comme le ferait l'objet.
const OUTCOMES_BY_SLUG = new Map(Object.entries(PROJECT_OUTCOMES));

export function projectOutcome(slug: string | undefined): ProjectOutcome | null {
  if (slug === undefined) return null;
  return OUTCOMES_BY_SLUG.get(slug) ?? null;
}
