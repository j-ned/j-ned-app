import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { AdminAnalytics } from './admin-analytics';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type {
  ActiveVisitors,
  DailyChartPoint,
  EntityStat,
  MetricEntry,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';

const overview = (overrides: Partial<StatsOverview> = {}): StatsOverview => ({
  visitors: 120,
  pageviews: 480,
  sessions: 150,
  bounces: 30,
  bounceRate: 20,
  avgDuration: 65,
  projectClicks: 12,
  articleViews: 8,
  cvDownloads: 4,
  ...overrides,
});

function makeAnalyticsGateway(overrides: Partial<AnalyticsGateway> = {}): AnalyticsGateway {
  const emptyMetrics: MetricEntry[] = [];
  const emptyChart: DailyChartPoint[] = [];
  const emptyEntities: EntityStat[] = [];
  const activeVisitors: ActiveVisitors = { count: 0 };
  return {
    getOverview: () => of(overview()),
    getChart: () => of(emptyChart),
    getMetrics: () => of(emptyMetrics),
    getActiveVisitors: () => of(activeVisitors),
    getProjectStats: () => of(emptyEntities),
    getArticleStats: () => of(emptyEntities),
    getCvDownloadCount: () => of(0),
    trackPageView: vi.fn(),
    trackPageDuration: vi.fn(),
    trackProjectClick: vi.fn(),
    trackArticleView: vi.fn(),
    trackCvDownload: vi.fn(),
    sendBeacon: vi.fn(),
    ...overrides,
  } as unknown as AnalyticsGateway;
}

async function setup(
  gateway: AnalyticsGateway = makeAnalyticsGateway(),
): Promise<{
  component: AdminAnalytics;
  fixture: ReturnType<typeof TestBed.createComponent<AdminAnalytics>>;
}> {
  TestBed.configureTestingModule({
    providers: [{ provide: AnalyticsGateway, useValue: gateway }],
    schemas: [NO_ERRORS_SCHEMA],
  });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(AdminAnalytics);
  fixture.detectChanges();
  // Le polling `interval(30_000)` garde l'app perpétuellement instable :
  // `whenStable()` ne résout jamais sous fake timers. On draine les
  // microtasks (loaders de resource(), startWith du polling) en avançant de 0.
  await vi.advanceTimersByTimeAsync(0);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture };
}

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('polling des visiteurs actifs', () => {
    it('charge immédiatement les visiteurs actifs (startWith)', async () => {
      const getActiveVisitors = vi.fn(() => of<ActiveVisitors>({ count: 5 }));
      const { component } = await setup(makeAnalyticsGateway({ getActiveVisitors }));
      expect(component.activeVisitors()).toBe(5);
      expect(getActiveVisitors).toHaveBeenCalledTimes(1);
    });

    it('re-interroge le gateway toutes les 30 s', async () => {
      let count = 1;
      const getActiveVisitors = vi.fn(() => of<ActiveVisitors>({ count: count++ }));
      const { component } = await setup(makeAnalyticsGateway({ getActiveVisitors }));
      expect(getActiveVisitors).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(30_000);
      expect(getActiveVisitors).toHaveBeenCalledTimes(2);
      expect(component.activeVisitors()).toBe(2);

      await vi.advanceTimersByTimeAsync(30_000);
      expect(getActiveVisitors).toHaveBeenCalledTimes(3);
    });

    it('cesse d’interroger le gateway après destruction', async () => {
      const getActiveVisitors = vi.fn(() => of<ActiveVisitors>({ count: 1 }));
      const { fixture } = await setup(makeAnalyticsGateway({ getActiveVisitors }));
      expect(getActiveVisitors).toHaveBeenCalledTimes(1);

      fixture.destroy();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(getActiveVisitors).toHaveBeenCalledTimes(1);
    });
  });

  describe('rendu des KPI', () => {
    it('expose les KPI de l’overview chargé', async () => {
      const { component } = await setup(
        makeAnalyticsGateway({ getOverview: () => of(overview({ visitors: 999, bounceRate: 12.34 })) }),
      );
      expect(component.overview()?.visitors).toBe(999);
      expect(component.bounceRateFormatted()).toBe('12.3');
    });

    it('formate la durée moyenne et les pages par session', async () => {
      const { component } = await setup(
        makeAnalyticsGateway({ getOverview: () => of(overview({ avgDuration: 90, pageviews: 300, sessions: 100 })) }),
      );
      expect(component.formattedDuration()).toBeTypeOf('string');
      expect(component.pagesPerSession()).toBeDefined();
    });
  });

  describe('changement de plage de dates', () => {
    it('démarre sur 30 jours par défaut', async () => {
      const { component } = await setup();
      expect(component.dateRange()).toBe('30d');
    });

    it('recharge l’overview quand la plage change', async () => {
      const getOverview = vi.fn(() => of(overview()));
      const { component } = await setup(makeAnalyticsGateway({ getOverview }));
      const callsBefore = getOverview.mock.calls.length;

      component.dateRange.set('7d');
      await vi.advanceTimersByTimeAsync(0);

      expect(component.dateRange()).toBe('7d');
      expect(getOverview.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
