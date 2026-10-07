import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { makeMetricEntry, makeStatsOverview } from '@features/analytics/testing/analytics-builders';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { overviewSummary, type OverviewSummaryInput } from './overview-copy';

const projects = (count: number): readonly Project[] =>
  Array.from({ length: count }, (_, index) => makeProject({ id: `p-${index}` }));

const published = (count: number): readonly BlogPost[] =>
  Array.from({ length: count }, (_, index) => makeBlogPost({ id: `a-${index}` }));

const BASE: OverviewSummaryInput = {
  overview: makeStatsOverview({ visitors: 42, cvDownloads: 0 }),
  referrers: [
    makeMetricEntry({ name: '', count: 20 }),
    makeMetricEntry({ name: 'google.com', count: 18 }),
  ],
  unread: 0,
  projects: projects(6),
  posts: published(2),
};

const AUDIENCE = '42 visiteurs en 30 jours, dont 18 venus de google.com.';
const CONTACTS = 'Aucun message en attente, aucun CV téléchargé.';
const CONTENT = 'Six réalisations et deux articles sont en ligne.';

describe('overviewSummary', () => {
  it('Given the October 2026 figures When summarised Then the three sentences read as in the mock-up', () => {
    expect(overviewSummary(BASE)).toBe(`${AUDIENCE} ${CONTACTS} ${CONTENT}`);
  });

  it.each([
    {
      label: 'a single visitor from a single referrer',
      overrides: {
        overview: makeStatsOverview({ visitors: 1, cvDownloads: 0 }),
        referrers: [makeMetricEntry({ name: 'github.com', count: 1 })],
      },
      expected: '1 visiteur en 30 jours, dont 1 venu de github.com.',
    },
    {
      label: 'no visitor',
      overrides: { overview: makeStatsOverview({ visitors: 0, cvDownloads: 0 }), referrers: [] },
      expected: 'Aucun visiteur en 30 jours.',
    },
    {
      label: 'only direct visits',
      overrides: { referrers: [makeMetricEntry({ name: '', count: 42 })] },
      expected: '42 visiteurs en 30 jours.',
    },
    {
      label: 'the referrers unavailable',
      overrides: { referrers: null },
      expected: '42 visiteurs en 30 jours.',
    },
  ] satisfies readonly {
    label: string;
    overrides: Partial<OverviewSummaryInput>;
    expected: string;
  }[])(
    'Given $label When summarised Then the audience sentence reads « $expected »',
    ({ overrides, expected }) => {
      expect(overviewSummary({ ...BASE, ...overrides })).toBe(`${expected} ${CONTACTS} ${CONTENT}`);
    },
  );

  it.each([
    {
      label: 'three unread messages and one CV',
      overrides: { unread: 3, overview: makeStatsOverview({ visitors: 42, cvDownloads: 1 }) },
      expected: '3 messages en attente, 1 CV téléchargé.',
    },
    {
      label: 'one unread message and two CVs',
      overrides: { unread: 1, overview: makeStatsOverview({ visitors: 42, cvDownloads: 2 }) },
      expected: '1 message en attente, 2 CV téléchargés.',
    },
    {
      label: 'the unread count unavailable',
      overrides: { unread: null },
      expected: 'Aucun CV téléchargé.',
    },
  ] satisfies readonly {
    label: string;
    overrides: Partial<OverviewSummaryInput>;
    expected: string;
  }[])(
    'Given $label When summarised Then the contact sentence reads « $expected »',
    ({ overrides, expected }) => {
      expect(overviewSummary({ ...BASE, ...overrides })).toBe(`${AUDIENCE} ${expected} ${CONTENT}`);
    },
  );

  it.each([
    {
      label: 'one project and one article',
      projects: projects(1),
      posts: published(1),
      expected: 'Une réalisation et un article sont en ligne.',
    },
    {
      label: 'more than ten projects',
      projects: projects(12),
      posts: published(10),
      expected: '12 réalisations et dix articles sont en ligne.',
    },
    {
      label: 'projects only',
      projects: projects(6),
      posts: [],
      expected: 'Six réalisations sont en ligne, aucun article.',
    },
    {
      label: 'a single project only',
      projects: projects(1),
      posts: [],
      expected: 'Une réalisation est en ligne, aucun article.',
    },
    {
      label: 'articles only',
      projects: [],
      posts: published(2),
      expected: 'Deux articles sont en ligne, aucune réalisation.',
    },
    { label: 'nothing online', projects: [], posts: [], expected: "Rien n'est en ligne." },
    {
      label: 'drafts among the articles',
      projects: projects(6),
      posts: [
        ...published(1),
        makeBlogPost({ id: 'd-1', status: 'draft' }),
        makeBlogPost({ id: 'd-2', status: 'draft' }),
      ],
      expected: 'Six réalisations et un article sont en ligne.',
    },
    {
      label: 'the projects unavailable',
      projects: null,
      posts: published(2),
      expected: 'Deux articles sont en ligne.',
    },
    {
      label: 'the articles unavailable',
      projects: projects(1),
      posts: null,
      expected: 'Une réalisation est en ligne.',
    },
    {
      label: 'the projects unavailable and no article',
      projects: null,
      posts: [],
      expected: "Aucun article n'est en ligne.",
    },
  ] satisfies readonly {
    label: string;
    projects: readonly Project[] | null;
    posts: readonly BlogPost[] | null;
    expected: string;
  }[])(
    'Given $label When summarised Then the content sentence reads « $expected »',
    ({ projects: list, posts, expected }) => {
      expect(overviewSummary({ ...BASE, projects: list, posts })).toBe(
        `${AUDIENCE} ${CONTACTS} ${expected}`,
      );
    },
  );

  it.each([
    {
      label: 'the statistics unavailable',
      overrides: { overview: null },
      expected: `Aucun message en attente. ${CONTENT}`,
    },
    {
      label: 'the statistics and the unread count unavailable',
      overrides: { overview: null, unread: null },
      expected: CONTENT,
    },
    {
      label: 'every source unavailable',
      overrides: { overview: null, referrers: null, unread: null, projects: null, posts: null },
      expected: '',
    },
  ] satisfies readonly {
    label: string;
    overrides: Partial<OverviewSummaryInput>;
    expected: string;
  }[])(
    'Given $label When summarised Then the sentences of the missing sources are left out',
    ({ overrides, expected }) => {
      expect(overviewSummary({ ...BASE, ...overrides })).toBe(expected);
    },
  );
});
