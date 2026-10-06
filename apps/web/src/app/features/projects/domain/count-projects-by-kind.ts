import type { Project, ProjectKindCounts } from './models/project.model';

export function countProjectsByKind(projects: readonly Project[]): ProjectKindCounts {
  const counts = { production: 0, demo: 0, script: 0 };
  for (const { kind } of projects) {
    if (kind) counts[kind] += 1;
  }
  return counts;
}
