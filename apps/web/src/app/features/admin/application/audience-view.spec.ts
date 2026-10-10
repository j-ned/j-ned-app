import type { MetricEntry } from '@features/analytics/domain/models/analytics.types';
import {
  makeEngagement,
  makeMetricEntry,
  makeStatsOverview,
} from '@features/analytics/testing/analytics-builders';
import { audienceLead, detailNote, toShareRows, toTallyRows, type ShareRow } from './audience-view';

const entry = (name: string, count: number): MetricEntry => makeMetricEntry({ name, count });

describe('toShareRows', () => {
  it.each<{
    case: string;
    entries: readonly MetricEntry[];
    total: number;
    limit: number;
    rows: readonly ShareRow[];
  }>([
    {
      case: 'under the limit',
      entries: [entry('/', 24), entry('/blog', 6), entry('/projects', 5)],
      total: 35,
      limit: 5,
      rows: [
        { label: '/', count: 24, share: '69\u00a0%', width: 100 },
        { label: '/blog', count: 6, share: '17\u00a0%', width: 25 },
        { label: '/projects', count: 5, share: '14\u00a0%', width: 21 },
      ],
    },
    {
      case: 'over the limit, the rest gathered under « Autres »',
      entries: [
        entry('/', 24),
        entry('/blog', 6),
        entry('/offres/site-vitrine', 6),
        entry('/projects', 5),
        entry('/about', 4),
        entry('/contact', 4),
        entry('/cv', 4),
        entry('/mentions-legales', 3),
      ],
      total: 56,
      limit: 5,
      rows: [
        { label: '/', count: 24, share: '43\u00a0%', width: 100 },
        { label: '/blog', count: 6, share: '11\u00a0%', width: 25 },
        { label: '/offres/site-vitrine', count: 6, share: '11\u00a0%', width: 25 },
        { label: '/projects', count: 5, share: '9\u00a0%', width: 21 },
        { label: '/about', count: 4, share: '7\u00a0%', width: 17 },
        { label: 'Autres', count: 11, share: '20\u00a0%', width: 46 },
      ],
    },
    {
      case: 'exactly at the limit, no « Autres »',
      entries: [entry('/', 3), entry('/blog', 1)],
      total: 4,
      limit: 2,
      rows: [
        { label: '/', count: 3, share: '75\u00a0%', width: 100 },
        { label: '/blog', count: 1, share: '25\u00a0%', width: 33 },
      ],
    },
    {
      case: 'shares taken on the given total, not on the listed rows',
      entries: [entry('google.com', 30), entry('linkedin.com', 20)],
      total: 100,
      limit: 5,
      rows: [
        { label: 'google.com', count: 30, share: '30\u00a0%', width: 100 },
        { label: 'linkedin.com', count: 20, share: '20\u00a0%', width: 67 },
      ],
    },
    {
      case: 'a total of zero',
      entries: [entry('/', 0)],
      total: 0,
      limit: 5,
      rows: [{ label: '/', count: 0, share: '0\u00a0%', width: 0 }],
    },
    { case: 'no entry', entries: [], total: 0, limit: 5, rows: [] },
  ])(
    'Given $case When the rows are built Then each row has its count, share and bar width',
    ({ entries, total, limit, rows }) => {
      expect(toShareRows(entries, total, limit, '/')).toEqual(rows);
    },
  );

  it('Given entries without a name When the rows are built Then they take the fallback label', () => {
    const rows = toShareRows([entry('', 20), entry('google.com', 18)], 38, 5, 'Accès direct');

    expect(rows.map((row) => row.label)).toEqual(['Accès direct', 'google.com']);
  });

  it.each([1, 2, 3, 8])(
    'Given eight entries and a limit of %i When the rows are built Then their counts add up to the entries',
    (limit) => {
      const entries = [5, 4, 4, 3, 2, 2, 1, 1].map((count, index) =>
        entry(`/page-${index}`, count),
      );

      const rows = toShareRows(entries, 22, limit, '/');

      expect({
        rows: rows.length,
        sum: rows.reduce((sum, row) => sum + row.count, 0),
      }).toEqual({ rows: limit === 8 ? 8 : limit + 1, sum: 22 });
    },
  );
});

describe('audienceLead', () => {
  const realBounce = (realBounceRate: number): ReturnType<typeof makeEngagement> =>
    makeEngagement({ realBounceRate, engagementRate: 100 - realBounceRate });

  it.each([
    {
      case: 'no figures yet',
      overview: null,
      referrer: null,
      lead: '',
    },
    {
      case: 'no visit',
      overview: makeStatsOverview({ visitors: 0, sessions: 0, engagement: realBounce(0) }),
      referrer: entry('google.com', 0),
      lead: 'Aucune visite sur la période.',
    },
    {
      case: 'the production readout, visits counted rather than the legacy visitors',
      overview: makeStatsOverview({ visitors: 99 }),
      referrer: entry('google.com', 18),
      lead: '42 visites, dont 18 venues de google.com. 4 sur 10 repartent en moins de 30\u00a0s, sans autre page ni action.',
    },
    {
      case: 'a single visit that left at once',
      overview: makeStatsOverview({ visitors: 1, sessions: 1, engagement: realBounce(100) }),
      referrer: entry('google.com', 1),
      lead: '1 visite, dont 1 venue de google.com. 10 sur 10 repartent en moins de 30\u00a0s, sans autre page ni action.',
    },
    {
      case: 'thousands of visits without a referrer',
      overview: makeStatsOverview({ sessions: 1500, engagement: realBounce(12) }),
      referrer: null,
      lead: '1\u202f500 visites. 1 sur 10 repart en moins de 30\u00a0s, sans autre page ni action.',
    },
    {
      case: 'direct access only and almost no real bounce, despite a high one-page bounce',
      overview: makeStatsOverview({ sessions: 42, bounceRate: 88.1, engagement: realBounce(4) }),
      referrer: entry('', 30),
      lead: '42 visites.',
    },
    {
      case: 'a threshold of 45 seconds',
      overview: makeStatsOverview({
        engagement: makeEngagement({ realBounceRate: 40.48, thresholdSeconds: 45 }),
      }),
      referrer: null,
      lead: '42 visites. 4 sur 10 repartent en moins de 45\u00a0s, sans autre page ni action.',
    },
    {
      case: 'an engagement never measured over the period',
      overview: makeStatsOverview({
        engagement: makeEngagement({
          measuredSince: null,
          measuredSessions: 0,
          engagedSessions: 0,
          realBounces: 0,
          realBounceRate: 0,
          engagementRate: 0,
        }),
      }),
      referrer: entry('google.com', 18),
      lead: '42 visites, dont 18 venues de google.com.',
    },
  ])(
    'Given $case When the lead is written Then it reads « $lead »',
    ({ overview, referrer, lead }) => {
      expect(audienceLead(overview, referrer)).toBe(lead);
    },
  );
});

describe('detailNote', () => {
  it.each([
    { case: 'no figures yet', overview: null, periodStart: '2026-09-07', note: '' },
    {
      case: 'details covering the whole period',
      overview: makeStatsOverview({ detailSince: '2026-09-07' }),
      periodStart: '2026-09-07',
      note: '',
    },
    {
      case: 'details starting after the period on 90 days',
      overview: makeStatsOverview({ detailSince: '2026-09-10' }),
      periodStart: '2026-07-12',
      note: 'Pages, provenances, actions et conversions par emplacement\u00a0: 30 derniers jours au plus, depuis le 10 septembre 2026.',
    },
    {
      case: 'details starting on the first of a month',
      overview: makeStatsOverview({ detailSince: '2026-09-01' }),
      periodStart: '2026-04-26',
      note: 'Pages, provenances, actions et conversions par emplacement\u00a0: 30 derniers jours au plus, depuis le 1er septembre 2026.',
    },
  ])(
    'Given $case When the detail note is written Then it reads « $note »',
    ({ overview, periodStart, note }) => {
      expect(detailNote(overview, periodStart)).toBe(note);
    },
  );
});

describe('toTallyRows', () => {
  const ENTRIES = [entry('Chrome', 26), entry('', 3), entry('Firefox', 1500)];

  it.each([
    {
      limit: 5,
      rows: [
        { label: 'Chrome', value: '26' },
        { label: 'Inconnu', value: '3' },
        { label: 'Firefox', value: '1\u202f500' },
      ],
    },
    {
      limit: 2,
      rows: [
        { label: 'Chrome', value: '26' },
        { label: 'Inconnu', value: '3' },
      ],
    },
  ])(
    'Given three entries and a limit of $limit When the tally is built Then it lists the first entries, named and counted',
    ({ limit, rows }) => {
      expect(toTallyRows(ENTRIES, limit, 'Inconnu')).toEqual(rows);
    },
  );

  it('Given no entry When the tally is built Then it is empty', () => {
    expect(toTallyRows([], 5, 'Inconnu')).toEqual([]);
  });
});
