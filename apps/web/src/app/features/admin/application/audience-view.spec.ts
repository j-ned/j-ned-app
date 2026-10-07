import type { MetricEntry } from '@features/analytics/domain/models/analytics.types';
import { makeMetricEntry, makeStatsOverview } from '@features/analytics/testing/analytics-builders';
import { audienceLead, toShareRows, toTallyRows, type ShareRow } from './audience-view';

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
  it.each([
    {
      case: 'no figures yet',
      overview: null,
      referrer: null,
      lead: '',
    },
    {
      case: 'no visitor',
      overview: makeStatsOverview({ visitors: 0, bounceRate: 0 }),
      referrer: entry('google.com', 0),
      lead: 'Aucun visiteur sur la période.',
    },
    {
      case: 'the production readout',
      overview: makeStatsOverview(),
      referrer: entry('google.com', 18),
      lead: '42 visiteurs, dont 18 venus de google.com. 9 sur 10 repartent après une page.',
    },
    {
      case: 'a single visitor who left at once',
      overview: makeStatsOverview({ visitors: 1, bounceRate: 100 }),
      referrer: entry('google.com', 1),
      lead: '1 visiteur, dont 1 venu de google.com. 10 sur 10 repartent après une page.',
    },
    {
      case: 'thousands of visitors without a referrer',
      overview: makeStatsOverview({ visitors: 1500, bounceRate: 12 }),
      referrer: null,
      lead: '1\u202f500 visiteurs. 1 sur 10 repart après une page.',
    },
    {
      case: 'direct access only and almost no bounce',
      overview: makeStatsOverview({ visitors: 42, bounceRate: 4 }),
      referrer: entry('', 30),
      lead: '42 visiteurs.',
    },
  ])(
    'Given $case When the lead is written Then it reads « $lead »',
    ({ overview, referrer, lead }) => {
      expect(audienceLead(overview, referrer)).toBe(lead);
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
