import type { Project } from '../models/project.model';

export function paginateProjects(
  projects: readonly Project[],
  currentPage: number,
  itemsPerPage: number,
): readonly Project[] {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return projects.slice(startIndex, endIndex);
}

export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}
