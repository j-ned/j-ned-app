import type { Project, ProjectKindFilter } from './models/project.model';

export function filterProjectsByKind(
  projects: readonly Project[],
  filter: ProjectKindFilter,
): readonly Project[] {
  return filter === 'all' ? projects : projects.filter((project) => project.kind === filter);
}
