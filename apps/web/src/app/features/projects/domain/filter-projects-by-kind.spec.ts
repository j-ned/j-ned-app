import type { Project, ProjectKind, ProjectKindFilter } from './models/project.model';
import { makeProject } from '../testing/project-builders';
import { filterProjectsByKind } from './filter-projects-by-kind';

const KINDS: readonly (ProjectKind | null)[] = [
  'demo',
  'production',
  null,
  'script',
  'production',
  'demo',
  null,
];

const CATALOG: readonly Project[] = KINDS.map((kind, index) =>
  makeProject({ id: `p-${index}`, kind }),
);

const ids = (projects: readonly Project[]): string[] => projects.map((project) => project.id);

describe('filterProjectsByKind', () => {
  it.each([
    { filter: 'all', expected: ['p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6'] },
    { filter: 'production', expected: ['p-1', 'p-4'] },
    { filter: 'demo', expected: ['p-0', 'p-5'] },
    { filter: 'script', expected: ['p-3'] },
  ] satisfies readonly { filter: ProjectKindFilter; expected: readonly string[] }[])(
    'Given natures in mixed order and projects without a nature When filtered by $filter Then only $expected remain, order kept',
    ({ filter, expected }) => {
      expect(ids(filterProjectsByKind(CATALOG, filter))).toEqual(expected);
    },
  );

  it.each(['production', 'demo', 'script'] satisfies readonly ProjectKind[])(
    'Given projects without a nature only When filtered by %s Then none remains',
    (filter) => {
      const projects = [makeProject({ id: 'a', kind: null }), makeProject({ id: 'b', kind: null })];

      expect(filterProjectsByKind(projects, filter)).toEqual([]);
    },
  );

  it('Given no project of the chosen nature When filtered Then the result is empty', () => {
    const projects = [makeProject({ id: 'a', kind: 'demo' }), makeProject({ id: 'b', kind: null })];

    expect(filterProjectsByKind(projects, 'script')).toEqual([]);
  });
});
