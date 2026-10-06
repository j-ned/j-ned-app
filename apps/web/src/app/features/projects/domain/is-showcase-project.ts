import type { Project } from './models/project.model';

export function isShowcaseProject(project: Project): boolean {
  return project.featured && project.kind === 'production';
}
