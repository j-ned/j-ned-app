import type { Project, ProjectKind } from './models/project.model';
import { makeProject } from '../testing/project-builders';
import { countProjectsByKind } from './count-projects-by-kind';

const projectsOfKinds = (kinds: readonly (ProjectKind | null)[]): readonly Project[] =>
  kinds.map((kind, index) => makeProject({ id: `p-${index}`, slug: `p-${index}`, kind }));

describe('countProjectsByKind', () => {
  it.each([
    {
      label: 'no project',
      kinds: [],
      expected: { production: 0, demo: 0, script: 0 },
    },
    {
      label: 'two of each nature',
      kinds: ['production', 'demo', 'script', 'script', 'demo', 'production'],
      expected: { production: 2, demo: 2, script: 2 },
    },
    {
      label: 'only production projects',
      kinds: ['production', 'production', 'production'],
      expected: { production: 3, demo: 0, script: 0 },
    },
    {
      label: 'a single demo',
      kinds: ['demo'],
      expected: { production: 0, demo: 1, script: 0 },
    },
    {
      label: 'scripts and a demo',
      kinds: ['script', 'demo', 'script', 'script'],
      expected: { production: 0, demo: 1, script: 3 },
    },
  ] satisfies readonly {
    label: string;
    kinds: readonly (ProjectKind | null)[];
    expected: Record<ProjectKind, number>;
  }[])('Given $label When counted Then every nature has its count', ({ kinds, expected }) => {
    expect(countProjectsByKind(projectsOfKinds(kinds))).toEqual(expected);
  });

  it('Given projects without a nature When counted Then they are counted under no nature', () => {
    const projects = projectsOfKinds([null, 'production', null, 'demo']);

    expect(countProjectsByKind(projects)).toEqual({ production: 1, demo: 1, script: 0 });
  });

  it('Given only projects without a nature When counted Then every nature is at zero', () => {
    expect(countProjectsByKind(projectsOfKinds([null, null]))).toEqual({
      production: 0,
      demo: 0,
      script: 0,
    });
  });
});
