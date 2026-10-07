import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { defer, of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import type { DateRangeKey } from '@features/analytics/domain/analytics-presenter';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type {
  DailyChartPoint,
  EntityStat,
  MetricEntry,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';
import { makeMetricEntry, makeStatsOverview } from '@features/analytics/testing/analytics-builders';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { AnalyticsDeviceExclusion } from '@core/analytics/analytics-device-exclusion';
import { AuthStore } from '@core/auth/auth-store';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { HttpAnalyticsGateway } from '@features/analytics/infra/gateways/http-analytics.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import { ToastStore } from '@shared/ui/toast-store';
import { AudienceReport } from './audience-report';

type Period = readonly [string | undefined, string | undefined];

type Doubles = {
  readonly getOverview: Mock<AnalyticsGateway['getOverview']>;
  readonly getChart: Mock<AnalyticsGateway['getChart']>;
  readonly getMetrics: Mock<AnalyticsGateway['getMetrics']>;
  readonly getProjectStats: Mock<AnalyticsGateway['getProjectStats']>;
  readonly getArticleStats: Mock<AnalyticsGateway['getArticleStats']>;
  readonly getArticleReadStats: Mock<AnalyticsGateway['getArticleReadStats']>;
  readonly getCtaStats: Mock<AnalyticsGateway['getCtaStats']>;
};

const METRIC_TYPES = ['url', 'referrer', 'browser', 'os', 'country'] as const;

const METRICS: Readonly<Record<string, readonly MetricEntry[]>> = {
  url: [
    makeMetricEntry({ name: '/', count: 24 }),
    makeMetricEntry({ name: '/blog', count: 6 }),
    makeMetricEntry({ name: '/projects', count: 5 }),
  ],
  referrer: [
    makeMetricEntry({ name: '', count: 20 }),
    makeMetricEntry({ name: 'google.com', count: 18 }),
    makeMetricEntry({ name: 'linkedin.com', count: 4 }),
  ],
};

const later = <T>(value: T): Observable<T> => defer(() => of(value));
const down = <T>(): Observable<T> => throwError(() => new Error('down'));

function makeDoubles(overview?: Mock<AnalyticsGateway['getOverview']>): Doubles {
  return {
    getOverview:
      overview ??
      vi.fn<AnalyticsGateway['getOverview']>(() => later<StatsOverview>(makeStatsOverview())),
    getChart: vi.fn<AnalyticsGateway['getChart']>(() => later<DailyChartPoint[]>([])),
    getMetrics: vi.fn<AnalyticsGateway['getMetrics']>((type) =>
      later<MetricEntry[]>([...(METRICS[type] ?? [])]),
    ),
    getProjectStats: vi.fn<AnalyticsGateway['getProjectStats']>(() => later<EntityStat[]>([])),
    getArticleStats: vi.fn<AnalyticsGateway['getArticleStats']>(() => later<EntityStat[]>([])),
    getArticleReadStats: vi.fn<AnalyticsGateway['getArticleReadStats']>(() =>
      later<EntityStat[]>([]),
    ),
    getCtaStats: vi.fn<AnalyticsGateway['getCtaStats']>(() => later<EntityStat[]>([])),
  };
}

async function flush(): Promise<void> {
  TestBed.tick();
  await TestBed.inject(ApplicationRef).whenStable();
  TestBed.tick();
}

async function openReport(doubles: Doubles = makeDoubles()): Promise<AudienceReport> {
  TestBed.configureTestingModule({
    providers: [
      AudienceReport,
      { provide: AnalyticsGateway, useValue: stubAnalyticsGateway(doubles) },
    ],
  });
  const report = TestBed.inject(AudienceReport);
  await flush();
  return report;
}

function lastPeriod<T extends (startDate?: string, endDate?: string) => unknown>(
  mock: Mock<T>,
): Period | null {
  const call: readonly (string | undefined)[] | undefined = mock.mock.calls.at(-1);
  return call ? [call[0], call[1]] : null;
}

const lastMetricPeriod = (doubles: Doubles, type: string): Period | null => {
  const call = doubles.getMetrics.mock.calls.filter(([requested]) => requested === type).at(-1);
  return call ? [call[1], call[2]] : null;
};

function requestedPeriods(doubles: Doubles): Readonly<Record<string, Period | null>> {
  return {
    overview: lastPeriod(doubles.getOverview),
    chart: lastPeriod(doubles.getChart),
    ...Object.fromEntries(METRIC_TYPES.map((type) => [type, lastMetricPeriod(doubles, type)])),
    projects: lastPeriod(doubles.getProjectStats),
    articles: lastPeriod(doubles.getArticleStats),
    articlesRead: lastPeriod(doubles.getArticleReadStats),
    cta: lastPeriod(doubles.getCtaStats),
  };
}

const everyEndpoint = (period: Period): Readonly<Record<string, Period>> => ({
  overview: period,
  chart: period,
  url: period,
  referrer: period,
  browser: period,
  os: period,
  country: period,
  projects: period,
  articles: period,
  articlesRead: period,
  cta: period,
});

describe('AudienceReport', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given the report is opened on Wednesday 7 October 2026 When nothing is chosen Then the ten period-bound sources are asked for the last 30 days', async () => {
    const doubles = makeDoubles();

    const report = await openReport(doubles);

    expect({ range: report.range(), periods: requestedPeriods(doubles) }).toEqual({
      range: '30d',
      periods: everyEndpoint(['2026-09-07', '2026-10-07']),
    });
  });

  it.each<{ range: DateRangeKey; period: Period }>([
    { range: '7d', period: ['2026-09-30', '2026-10-07'] },
    { range: '90d', period: ['2026-07-09', '2026-10-07'] },
    { range: 'all', period: [undefined, undefined] },
  ])(
    'Given the report on 30 days When the period becomes $range Then every source is asked again with the new dates',
    async ({ range, period }) => {
      const doubles = makeDoubles();
      const report = await openReport(doubles);

      report.range.set(range);
      await flush();

      expect({
        overviewCalls: doubles.getOverview.mock.calls.length,
        periods: requestedPeriods(doubles),
      }).toEqual({ overviewCalls: 2, periods: everyEndpoint(period) });
    },
  );

  it('Given pages and referrers When the report is loaded Then both become share rows, direct access named', async () => {
    const report = await openReport();

    expect({ pages: report.pages(), referrers: report.referrers() }).toEqual({
      pages: [
        { label: '/', count: 24, share: '69\u00a0%', width: 100 },
        { label: '/blog', count: 6, share: '17\u00a0%', width: 25 },
        { label: '/projects', count: 5, share: '14\u00a0%', width: 21 },
      ],
      referrers: [
        { label: 'Accès direct', count: 20, share: '48\u00a0%', width: 100 },
        { label: 'google.com', count: 18, share: '43\u00a0%', width: 90 },
        { label: 'linkedin.com', count: 4, share: '10\u00a0%', width: 20 },
      ],
    });
  });

  it('Given the overview failed once When the report retries Then only that source is asked again and the error clears', async () => {
    const getOverview = vi
      .fn<AnalyticsGateway['getOverview']>()
      .mockReturnValueOnce(down())
      .mockReturnValue(later(makeStatsOverview()));
    const doubles = makeDoubles(getOverview);
    const report = await openReport(doubles);
    const failed = report.hasError();

    report.retry();
    await flush();

    expect({
      failed,
      hasError: report.hasError(),
      overviewCalls: getOverview.mock.calls.length,
      chartCalls: doubles.getChart.mock.calls.length,
    }).toEqual({ failed: true, hasError: false, overviewCalls: 2, chartCalls: 1 });
  });
});

describe('AudienceReport: vraie passerelle HTTP et intercepteur de toasts', () => {
  const BODIES: Readonly<Record<string, unknown>> = {
    overview: makeStatsOverview(),
    chart: [],
    projects: [],
    articles: [],
    'articles-read': [],
    cta: [],
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given the five metrics answer 500 When the report loads Then it reports its own error and no toast is shown', async () => {
    const add = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        AudienceReport,
        { provide: AnalyticsGateway, useClass: HttpAnalyticsGateway },
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthStore, useValue: { isLoggedIn: signal(false) } },
        { provide: AnalyticsDeviceExclusion, useValue: { excluded: signal(false) } },
        { provide: ToastStore, useValue: { add } },
      ],
    });
    const report = TestBed.inject(AudienceReport);
    const httpController = TestBed.inject(HttpTestingController);
    TestBed.tick();

    const requests = httpController.match(() => true);
    const failed = requests.filter((request) => request.request.url.endsWith('/stats/metrics'));
    requests.forEach((request) => {
      const endpoint = request.request.url.split('/').at(-1) ?? '';
      if (endpoint === 'metrics') {
        request.flush(null, { status: 500, statusText: 'Server Error' });
      } else {
        request.flush(BODIES[endpoint] ?? null);
      }
    });
    await flush();

    expect({
      requests: requests.length,
      failed: failed.length,
      hasError: report.hasError(),
      toasts: add.mock.calls.length,
    }).toEqual({ requests: 11, failed: 5, hasError: true, toasts: 0 });
    httpController.verify();
  });
});
