import type { Project, ProjectKind } from './models/project.model';
import { makeProject } from '../testing/project-builders';
import { splitCaseStudies } from './split-case-studies';

const projectsOfKinds = (kinds: readonly (ProjectKind | null)[]): readonly Project[] =>
  kinds.map((kind, index) => makeProject({ id: `p-${index}`, slug: `p-${index}`, kind }));

const ids = (projects: readonly Project[]): string[] => projects.map((project) => project.id);

describe('splitCaseStudies', () => {
  it.each([
    {
      label: 'the mockup catalog',
      kinds: ['production', 'production', 'demo', 'demo', 'script', 'script'],
      caseStudies: ['p-0', 'p-1'],
      others: ['p-2', 'p-3', 'p-4', 'p-5'],
    },
    {
      label: 'natures in mixed order',
      kinds: ['demo', 'production', 'script', 'production', 'demo'],
      caseStudies: ['p-1', 'p-3'],
      others: ['p-0', 'p-2', 'p-4'],
    },
    {
      label: 'projects without a nature',
      kinds: [null, 'production', null, 'script'],
      caseStudies: ['p-1'],
      others: ['p-0', 'p-2', 'p-3'],
    },
    {
      label: 'only production projects',
      kinds: ['production', 'production'],
      caseStudies: ['p-0', 'p-1'],
      others: [],
    },
    {
      label: 'no production project',
      kinds: ['demo', 'script'],
      caseStudies: [],
      others: ['p-0', 'p-1'],
    },
    { label: 'no project', kinds: [], caseStudies: [], others: [] },
  ] satisfies readonly {
    label: string;
    kinds: readonly (ProjectKind | null)[];
    caseStudies: readonly string[];
    others: readonly string[];
  }[])(
    'Given $label When split Then production projects become case studies and the rest stays apart, order kept',
    ({ kinds, caseStudies, others }) => {
      const split = splitCaseStudies(projectsOfKinds(kinds));

      expect({ caseStudies: ids(split.caseStudies), others: ids(split.others) }).toEqual({
        caseStudies,
        others,
      });
    },
  );

  it('Given a featured demo and a production project that is not featured When split Then only the nature decides', () => {
    const split = splitCaseStudies([
      makeProject({ id: 'demo', kind: 'demo', featured: true }),
      makeProject({ id: 'prod', kind: 'production', featured: false }),
    ]);

    expect({ caseStudies: ids(split.caseStudies), others: ids(split.others) }).toEqual({
      caseStudies: ['prod'],
      others: ['demo'],
    });
  });
});
