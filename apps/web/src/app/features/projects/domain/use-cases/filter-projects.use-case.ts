import type { Project } from '../models';

export const FILTER_ALL = '__ALL__';

export function filterProjects(
  projects: readonly Project[],
  category: string,
): readonly Project[] {
  if (category === FILTER_ALL) {
    return projects;
  }
  return projects.filter((p) => p.category === category);
}
