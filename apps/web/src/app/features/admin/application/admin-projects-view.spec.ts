import type { Project, ProjectKindFilter } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { toAdminProjectsView } from './admin-projects-view';

const DASHFLOW = makeProject({
  id: 'p-1',
  slug: 'dashflow',
  title: 'DashFlow',
  category: 'Application Web',
  image: 'https://cdn.test/projects/dashflow.avif',
  kind: 'production',
  featured: true,
  tags: [
    'Angular',
    'TypeScript',
    'NestJS',
    'Docker',
    'PostgreSQL',
    'TailwindCSS',
    'Redis',
    'Vitest',
  ],
  pitch: 'Le foyer dans une seule app.',
});

const CATALOGUE: readonly Project[] = [
  DASHFLOW,
  makeProject({ id: 'p-2', title: 'CandiDash', kind: 'production' }),
  makeProject({ id: 'p-3', title: 'Le Vieux Comptoir', kind: 'demo' }),
  makeProject({ id: 'p-4', title: 'Sans nature', kind: null }),
  makeProject({ id: 'p-5', title: 'Coaching Life', kind: 'demo' }),
];

describe('toAdminProjectsView: filtres', () => {
  it('Given a catalogue without script When the filters are built Then « Tous » counts everything, each nature its own, and an empty nature is disabled', () => {
    expect(toAdminProjectsView(CATALOGUE, 'all').filters).toEqual([
      { value: 'all', label: 'Tous', count: 5, disabled: false },
      { value: 'production', label: 'En production', count: 2, disabled: false },
      { value: 'demo', label: 'Démos', count: 2, disabled: false },
      { value: 'script', label: 'Scripts', count: 0, disabled: true },
    ]);
  });

  it.each(['all', 'production', 'demo', 'script'] as const)(
    'Given the filter %s When the view is built Then the filters stay the same four',
    (filter) => {
      expect(toAdminProjectsView(CATALOGUE, filter).filters.map((option) => option.count)).toEqual([
        5, 2, 2, 0,
      ]);
    },
  );
});

describe('toAdminProjectsView: lignes', () => {
  it.each([
    { filter: 'all', ids: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'] },
    { filter: 'production', ids: ['p-1', 'p-2'] },
    { filter: 'demo', ids: ['p-3', 'p-5'] },
    { filter: 'script', ids: [] },
  ] satisfies readonly { filter: ProjectKindFilter; ids: readonly string[] }[])(
    'Given the filter $filter When the rows are built Then they are $ids, in list order',
    ({ filter, ids }) => {
      expect(toAdminProjectsView(CATALOGUE, filter).rows.map((row) => row.id)).toEqual(ids);
    },
  );

  it('Given a featured project in production When its row is built Then it reads rank, overline, pitch, cover, nature and facts', () => {
    expect(toAdminProjectsView(CATALOGUE, 'all').rows[0]).toEqual({
      id: 'p-1',
      slug: 'dashflow',
      order: '01',
      overline: '01 · Application Web',
      title: 'DashFlow',
      pitch: 'Le foyer dans une seule app.',
      image: 'https://cdn.test/projects/dashflow.avif',
      kind: 'production',
      facts: [
        { label: 'Stack', value: 'Angular · TypeScript · NestJS · Docker +4' },
        { label: 'Accueil', value: 'Mis en avant' },
      ],
    });
  });

  it('Given the demos filtered When their rows are built Then each keeps its rank in the full list', () => {
    expect(
      toAdminProjectsView(CATALOGUE, 'demo').rows.map((row) => [row.order, row.overline]),
    ).toEqual([
      ['03', '03 · Web'],
      ['05', '05 · Web'],
    ]);
  });

  it('Given ten projects When the rows are built Then the tenth reads « 10 »', () => {
    const ten = Array.from({ length: 10 }, (_, index) =>
      makeProject({ id: `p-${index + 1}`, kind: 'demo' }),
    );

    expect(
      toAdminProjectsView(ten, 'all')
        .rows.map((row) => row.order)
        .slice(8),
    ).toEqual(['09', '10']);
  });

  it.each([
    { tags: [], facts: [] },
    { tags: ['Bash'], facts: [{ label: 'Stack', value: 'Bash' }] },
    {
      tags: ['Bash', 'Git', 'CLI', 'Linux'],
      facts: [{ label: 'Stack', value: 'Bash · Git · CLI · Linux' }],
    },
    {
      tags: ['Bash', 'Git', 'CLI', 'Linux', 'Docker'],
      facts: [{ label: 'Stack', value: 'Bash · Git · CLI · Linux +1' }],
    },
  ])(
    'Given a project not featured with tags $tags When its row is built Then its facts are $facts',
    ({ tags, facts }) => {
      const row = toAdminProjectsView([makeProject({ tags, featured: false })], 'all').rows[0];

      expect(row?.facts).toEqual(facts);
    },
  );

  it('Given a featured project without tags When its row is built Then its only fact is the home mention', () => {
    const row = toAdminProjectsView([makeProject({ tags: [], featured: true })], 'all').rows[0];

    expect(row?.facts).toEqual([{ label: 'Accueil', value: 'Mis en avant' }]);
  });

  it.each([
    { pitch: 'Une accroche.', shown: 'Une accroche.' },
    { pitch: null, shown: null },
    { pitch: '', shown: null },
  ])(
    'Given the pitch « $pitch » When the row is built Then it shows $shown',
    ({ pitch, shown }) => {
      expect(toAdminProjectsView([makeProject({ pitch })], 'all').rows[0]?.pitch).toBe(shown);
    },
  );

  it('Given a project without nature When the view is built Then it shows under « Tous » with a null nature, and under no nature filter', () => {
    const lonely = [makeProject({ id: 'p-x', kind: null })];

    expect({
      all: toAdminProjectsView(lonely, 'all').rows.map((row) => [row.id, row.kind]),
      byKind: (['production', 'demo', 'script'] as const).flatMap(
        (kind) => toAdminProjectsView(lonely, kind).rows,
      ),
    }).toEqual({ all: [['p-x', null]], byKind: [] });
  });
});
