import type { Project } from '../models/project.model';
import { makeProject } from '../../testing/project-builders';
import {
  filterProjects,
  FILTER_ALL,
} from '@features/projects/domain/use-cases/filter-projects.use-case';

describe('filterProjects', () => {
  const projects: readonly Project[] = [
    makeProject({ id: '1', category: 'Frontend' }),
    makeProject({ id: '2', category: 'Backend' }),
    makeProject({ id: '3', category: 'Frontend' }),
    makeProject({ id: '4', category: 'Fullstack' }),
  ];

  describe('Given the category is FILTER_ALL', () => {
    it('When filtering, Then all projects are returned unchanged', () => {
      const result = filterProjects(projects, FILTER_ALL);
      expect(result).toBe(projects);
      expect(result).toHaveLength(4);
    });
  });

  describe('Given a specific category', () => {
    it.each([
      { category: 'Frontend', expectedCount: 2 },
      { category: 'Backend', expectedCount: 1 },
      { category: 'Fullstack', expectedCount: 1 },
      { category: 'Unknown', expectedCount: 0 },
    ])(
      'When filtering by "$category", Then $expectedCount project(s) returned',
      ({ category, expectedCount }) => {
        const result = filterProjects(projects, category);
        expect(result).toHaveLength(expectedCount);
        expect(result.every((p) => p.category === category)).toBe(true);
      },
    );
  });

  describe('Given an empty project list', () => {
    it('When filtering by any category, Then an empty list is returned', () => {
      expect(filterProjects([], 'Frontend')).toEqual([]);
      expect(filterProjects([], FILTER_ALL)).toEqual([]);
    });
  });
});
