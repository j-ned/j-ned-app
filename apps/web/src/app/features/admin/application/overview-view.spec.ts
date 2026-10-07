import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import type { DailyChartPoint } from '@features/analytics/domain/models/analytics.types';
import { makeChartPoint, makeStatsOverview } from '@features/analytics/testing/analytics-builders';
import type { Project, ProjectKind } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import {
  chartSummary,
  latestMessages,
  toAudienceReadout,
  toContentRows,
  toOnlineRows,
} from './overview-view';

const ONLINE_LABELS = ['En production', 'Démos', 'Scripts', 'Articles'] as const;

const onlineRows = (
  values: readonly [string, string, string, string],
): readonly { label: string; value: string }[] =>
  ONLINE_LABELS.map((label, index) => ({ label, value: values[index] ?? '' }));

const projectsOfKinds = (kinds: readonly (ProjectKind | null)[]): readonly Project[] =>
  kinds.map((kind, index) => makeProject({ id: `p-${index}`, slug: `p-${index}`, kind }));

const postsOfStatus = (statuses: readonly BlogPost['status'][]): readonly BlogPost[] =>
  statuses.map((status, index) => makeBlogPost({ id: `a-${index}`, status }));

describe('toOnlineRows', () => {
  it.each([
    {
      label: 'the catalogue in production',
      kinds: ['production', 'production', 'demo', 'demo', 'script', 'script'],
      statuses: ['published', 'published'],
      expected: ['2 projets', '2 projets', '2 projets', '2 publiés'],
    },
    {
      label: 'nothing online yet',
      kinds: [],
      statuses: [],
      expected: ['0 projet', '0 projet', '0 projet', '0 publié'],
    },
    {
      label: 'one of each',
      kinds: ['production', 'demo', 'script'],
      statuses: ['published'],
      expected: ['1 projet', '1 projet', '1 projet', '1 publié'],
    },
    {
      label: 'projects without a nature',
      kinds: [null, 'production', null],
      statuses: [],
      expected: ['1 projet', '0 projet', '0 projet', '0 publié'],
    },
    {
      label: 'drafts among the articles',
      kinds: ['demo'],
      statuses: ['draft', 'published', 'draft'],
      expected: ['0 projet', '1 projet', '0 projet', '1 publié'],
    },
  ] satisfies readonly {
    label: string;
    kinds: readonly (ProjectKind | null)[];
    statuses: readonly BlogPost['status'][];
    expected: readonly [string, string, string, string];
  }[])(
    'Given $label When the online cartouche is built Then it reads $expected',
    ({ kinds, statuses, expected }) => {
      expect(toOnlineRows(projectsOfKinds(kinds), postsOfStatus(statuses))).toEqual(
        onlineRows(expected),
      );
    },
  );

  it.each([
    {
      label: 'the projects failed',
      projects: null,
      posts: postsOfStatus(['published', 'published']),
      expected: ['indisponible', 'indisponible', 'indisponible', '2 publiés'],
    },
    {
      label: 'the articles failed',
      projects: projectsOfKinds(['production', 'demo']),
      posts: null,
      expected: ['1 projet', '1 projet', '0 projet', 'indisponible'],
    },
    {
      label: 'both sources failed',
      projects: null,
      posts: null,
      expected: ['indisponible', 'indisponible', 'indisponible', 'indisponible'],
    },
  ] satisfies readonly {
    label: string;
    projects: readonly Project[] | null;
    posts: readonly BlogPost[] | null;
    expected: readonly [string, string, string, string];
  }[])(
    'Given $label When the online cartouche is built Then the missing source never reads as zero',
    ({ projects, posts, expected }) => {
      expect(toOnlineRows(projects, posts)).toEqual(onlineRows(expected));
    },
  );
});

describe('toAudienceReadout', () => {
  it.each([
    {
      label: 'the October 2026 figures',
      overview: makeStatsOverview(),
      expected: [
        { label: 'Pages vues', value: '56', unit: '', detail: '1,3 page par session' },
        { label: 'Rebond', value: '88,1', unit: '\u00a0%', detail: '37 sessions sur 42' },
        { label: 'Durée moyenne', value: '22', unit: '\u00a0s', detail: 'par page' },
      ],
    },
    {
      label: 'large figures and a duration over a minute',
      overview: makeStatsOverview({
        pageviews: 12345,
        sessions: 500,
        bounces: 1,
        bounceRate: 0.02,
        avgDuration: 65,
      }),
      expected: [
        { label: 'Pages vues', value: '12\u202f345', unit: '', detail: '24,7 pages par session' },
        { label: 'Rebond', value: '0', unit: '\u00a0%', detail: '1 session sur 500' },
        { label: 'Durée moyenne', value: '1\u00a0min 05', unit: '\u00a0s', detail: 'par page' },
      ],
    },
    {
      label: 'a period without any visit',
      overview: makeStatsOverview({
        visitors: 0,
        pageviews: 0,
        sessions: 0,
        bounces: 0,
        bounceRate: 0,
        avgDuration: 0,
      }),
      expected: [
        { label: 'Pages vues', value: '0', unit: '', detail: '0 page par session' },
        { label: 'Rebond', value: '0', unit: '\u00a0%', detail: '0 session sur 0' },
        { label: 'Durée moyenne', value: '0', unit: '\u00a0s', detail: 'par page' },
      ],
    },
  ])(
    'Given $label When the readout is built Then it is written in French',
    ({ overview, expected }) => {
      expect(toAudienceReadout(overview)).toEqual(expected);
    },
  );
});

describe('chartSummary', () => {
  const day = (date: string, visitors: number): DailyChartPoint =>
    makeChartPoint({ date, visitors });

  it.each([
    {
      label: 'no point',
      points: [],
      expected: 'Aucune visite sur la période.',
    },
    {
      label: 'a single day',
      points: [day('2026-09-07', 6)],
      expected: 'Visiteurs le 7 septembre 2026\u00a0: 6.',
    },
    {
      label: 'one peak',
      points: [day('2026-09-07', 6), day('2026-09-20', 5), day('2026-10-06', 1)],
      expected:
        'Visiteurs par jour du 7 septembre au 6 octobre 2026\u00a0: maximum 6 le 7 septembre.',
    },
    {
      label: 'two days tied',
      points: [day('2026-09-07', 5), day('2026-09-20', 5), day('2026-10-06', 1)],
      expected:
        'Visiteurs par jour du 7 septembre au 6 octobre 2026\u00a0: maximum 5 le 7 septembre et le 20 septembre.',
    },
    {
      label: 'three days tied, the first of the month among them',
      points: [day('2026-09-01', 2), day('2026-09-03', 2), day('2026-09-09', 2)],
      expected:
        'Visiteurs par jour du 1er septembre au 9 septembre 2026\u00a0: maximum 2 le 1er septembre, le 3 septembre et le 9 septembre.',
    },
    {
      label: 'days without any visit',
      points: [day('2026-09-07', 0), day('2026-09-08', 0)],
      expected: 'Visiteurs par jour du 7 septembre au 8 septembre 2026\u00a0: aucune visite.',
    },
    {
      label: 'a period across two years',
      points: [day('2025-12-30', 3), day('2026-01-02', 1)],
      expected:
        'Visiteurs par jour du 30 décembre 2025 au 2 janvier 2026\u00a0: maximum 3 le 30 décembre 2025.',
    },
  ] satisfies readonly { label: string; points: readonly DailyChartPoint[]; expected: string }[])(
    'Given $label When the chart is summarised Then the text alternative reads « $expected »',
    ({ points, expected }) => {
      expect(chartSummary(points)).toBe(expected);
    },
  );
});

describe('toContentRows', () => {
  const posts: readonly BlogPost[] = [
    makeBlogPost({
      id: 'career',
      title: 'De 20 ans de métallurgie à développeur Full-Stack',
      coverImage: 'https://cdn.test/career.avif',
      contentMarkdown: 'mot '.repeat(221),
      publishedAt: '2026-09-01T12:00:00Z',
    }),
    makeBlogPost({ id: 'draft', title: 'Brouillon', status: 'draft', publishedAt: null }),
    makeBlogPost({
      id: 'encryption',
      title: 'Chiffrement côté client',
      coverImage: '',
      contentMarkdown: '',
      publishedAt: '2026-09-09T12:00:00Z',
    }),
  ];

  const projects: readonly Project[] = [
    makeProject({
      id: 'lvc',
      title: 'Le Vieux Comptoir',
      category: 'Application Web',
      kind: 'demo',
      order: 2,
      image: 'https://cdn.test/lvc.avif',
    }),
    makeProject({
      id: 'dashflow',
      title: 'DashFlow',
      category: 'Application Web',
      kind: 'production',
      featured: true,
      order: 0,
    }),
    makeProject({
      id: 'candidash',
      title: 'CandiDash',
      category: 'Application Web',
      kind: 'production',
      featured: true,
      order: 1,
    }),
    makeProject({ id: 'tool', title: 'Outil', category: 'Script', kind: null, order: 3 }),
  ];

  const ENCRYPTION = {
    key: 'post:encryption',
    kind: 'post',
    title: 'Chiffrement côté client',
    href: '/admin/blog',
    image: '',
    meta: 'Article · 9 sept. 2026 · 1\u00a0min',
    stamp: 'Publié',
  };
  const CAREER = {
    key: 'post:career',
    kind: 'post',
    title: 'De 20 ans de métallurgie à développeur Full-Stack',
    href: '/admin/blog',
    image: 'https://cdn.test/career.avif',
    meta: 'Article · 1er sept. 2026 · 2\u00a0min',
    stamp: 'Publié',
  };
  const DASHFLOW = {
    key: 'project:dashflow',
    kind: 'project',
    title: 'DashFlow',
    href: '/admin/projects',
    image: '',
    meta: 'Projet · Application Web · mis en avant',
    stamp: 'En production',
  };
  const CANDIDASH = { ...DASHFLOW, key: 'project:candidash', title: 'CandiDash' };
  const LVC = {
    key: 'project:lvc',
    kind: 'project',
    title: 'Le Vieux Comptoir',
    href: '/admin/projects',
    image: 'https://cdn.test/lvc.avif',
    meta: 'Projet · Application Web',
    stamp: 'Démo',
  };
  const TOOL = {
    key: 'project:tool',
    kind: 'project',
    title: 'Outil',
    href: '/admin/projects',
    image: '',
    meta: 'Projet · Script',
    stamp: null,
  };

  it('Given articles and projects When five rows are kept Then published articles come first, newest first, then projects in public order', () => {
    expect(toContentRows(projects, posts, 5)).toEqual([
      ENCRYPTION,
      CAREER,
      DASHFLOW,
      CANDIDASH,
      LVC,
    ]);
  });

  it.each([
    { label: 'two rows', projects, posts, limit: 2, expected: [ENCRYPTION, CAREER] },
    {
      label: 'room for everything',
      projects,
      posts,
      limit: 10,
      expected: [ENCRYPTION, CAREER, DASHFLOW, CANDIDASH, LVC, TOOL],
    },
    {
      label: 'the projects missing',
      projects: null,
      posts,
      limit: 5,
      expected: [ENCRYPTION, CAREER],
    },
    {
      label: 'the articles missing',
      projects,
      posts: null,
      limit: 5,
      expected: [DASHFLOW, CANDIDASH, LVC, TOOL],
    },
    { label: 'nothing online', projects: [], posts: [], limit: 5, expected: [] },
  ])('Given $label When the content rows are built Then they are $expected.length', (scenario) => {
    expect(toContentRows(scenario.projects, scenario.posts, scenario.limit)).toEqual(
      scenario.expected,
    );
  });

  it('Given a published article without a publication date When listed Then its last edit date is shown', () => {
    const post = makeBlogPost({
      id: 'legacy',
      title: 'Ancien',
      publishedAt: null,
      updatedAt: '2026-08-31T12:00:00Z',
      contentMarkdown: '',
    });

    expect(toContentRows([], [post], 5).map((row) => row.meta)).toEqual([
      'Article · 31 août 2026 · 1\u00a0min',
    ]);
  });
});

describe('latestMessages', () => {
  const messages: readonly ContactMessage[] = [
    makeContactMessage({ id: 1, createdAt: '2026-01-01T10:00:00Z' }),
    makeContactMessage({ id: 2, createdAt: '2026-03-01T10:00:00Z' }),
    makeContactMessage({ id: 3, createdAt: '2026-02-01T10:00:00Z' }),
    makeContactMessage({ id: 4, createdAt: '2026-04-01T10:00:00Z' }),
  ];

  it.each([
    { label: 'four messages', messages, limit: 3, expected: [4, 2, 3] },
    { label: 'fewer messages than the limit', messages, limit: 10, expected: [4, 2, 3, 1] },
    { label: 'no message', messages: [], limit: 3, expected: [] },
  ])(
    'Given $label When the latest are kept Then they are the most recent first',
    ({ messages: list, limit, expected }) => {
      expect(latestMessages(list, limit).map((message) => message.id)).toEqual(expected);
    },
  );
});
