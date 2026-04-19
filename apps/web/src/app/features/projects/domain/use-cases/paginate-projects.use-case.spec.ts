import type { Project } from '../models';
import { calculateTotalPages, paginateProjects } from '@features/projects/domain';

function makeProjects(count: number): readonly Project[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `Project ${i + 1}`,
    category: 'Frontend',
    tags: [],
    description: '',
    image: '',
    featured: false,
    order: i,
  }));
}

describe('paginateProjects', () => {
  describe('Given 10 projects with 3 items per page', () => {
    const projects = makeProjects(10);

    it.each([
      { page: 1, expectedIds: ['1', '2', '3'] },
      { page: 2, expectedIds: ['4', '5', '6'] },
      { page: 3, expectedIds: ['7', '8', '9'] },
      { page: 4, expectedIds: ['10'] },
    ])('When requesting page $page, Then returns ids $expectedIds', ({ page, expectedIds }) => {
      const result = paginateProjects(projects, page, 3);
      expect(result.map((p) => p.id)).toEqual(expectedIds);
    });

    it('When requesting page beyond range, Then returns empty', () => {
      expect(paginateProjects(projects, 5, 3)).toEqual([]);
    });
  });

  describe('Given an empty list', () => {
    it('Then any page returns empty', () => {
      expect(paginateProjects([], 1, 10)).toEqual([]);
    });
  });
});

describe('calculateTotalPages', () => {
  it.each([
    { total: 0, perPage: 3, expected: 0 },
    { total: 1, perPage: 3, expected: 1 },
    { total: 3, perPage: 3, expected: 1 },
    { total: 4, perPage: 3, expected: 2 },
    { total: 10, perPage: 3, expected: 4 },
    { total: 9, perPage: 3, expected: 3 },
  ])('$total items × $perPage per page = $expected page(s)', ({ total, perPage, expected }) => {
    expect(calculateTotalPages(total, perPage)).toBe(expected);
  });
});
