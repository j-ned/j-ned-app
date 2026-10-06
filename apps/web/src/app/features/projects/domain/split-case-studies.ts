import type { Project } from './models/project.model';

type CaseStudiesSplit = {
  readonly caseStudies: readonly Project[];
  readonly others: readonly Project[];
};

export function splitCaseStudies(projects: readonly Project[]): CaseStudiesSplit {
  return {
    caseStudies: projects.filter((project) => project.kind === 'production'),
    others: projects.filter((project) => project.kind !== 'production'),
  };
}
