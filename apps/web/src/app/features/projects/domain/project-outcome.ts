import type { ProjectOutcome } from './models/project-outcome.model';
import { PROJECT_OUTCOMES } from './project-outcomes.static-data';

export function projectOutcome(slug: string | undefined): ProjectOutcome | null {
  return slug !== undefined && Object.hasOwn(PROJECT_OUTCOMES, slug)
    ? PROJECT_OUTCOMES[slug]
    : null;
}
