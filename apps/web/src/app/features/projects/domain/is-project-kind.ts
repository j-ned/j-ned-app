import { PROJECT_KINDS, type ProjectKind } from './models/project.model';

export function isProjectKind(value: unknown): value is ProjectKind {
  return PROJECT_KINDS.some((kind) => kind === value);
}
