import type { ProjectOutcome } from './models/project-outcome.model';
import { PROJECT_OUTCOMES } from './project-outcomes.static-data';

export function projectOutcome(slug: string | undefined): ProjectOutcome | null {
  if (slug === undefined || !Object.hasOwn(PROJECT_OUTCOMES, slug)) return null;
  return PROJECT_OUTCOMES[slug] ?? null;
}
