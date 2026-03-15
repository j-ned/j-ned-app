import type { Project } from '../models';

export function filterProjects(
  projects: readonly Project[],
  category: string,
): readonly Project[] {
  if (category === 'Tous') {
    return projects;
  }
  return projects.filter((p) => p.category === category);
}
