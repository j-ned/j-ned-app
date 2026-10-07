import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, type Observable } from 'rxjs';
import { testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
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
  ctaClicks: 6,
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
    getArticleReadStats: () => of(emptyEntities),
    getCtaStats: () => of(emptyEntities),
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

async function setup(gateway: AnalyticsGateway = makeAnalyticsGateway()): Promise<{
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
    const kpi = (fixture: { nativeElement: HTMLElement }, testId: string): string =>
      (fixture.nativeElement.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '')
        .replace(/[ \t\n\r]+/g, ' ')
        .replace(/^ | $/g, '');

    it('expose les KPI de l’overview chargé', async () => {
      const { component, fixture } = await setup(
        makeAnalyticsGateway({
          getOverview: () => of(overview({ visitors: 999, bounceRate: 12.34 })),
        }),
      );
      expect(component.overview()?.visitors).toBe(999);
      expect(kpi(fixture, 'kpi-bounce-rate')).toBe('12,3\u00a0%');
    });

    it.each([
      {
        given: { avgDuration: 90, pageviews: 300, sessions: 100 },
        duration: '1\u00a0min 30\u00a0s',
        perSession: '3,0 pages par session',
      },
      {
        given: { avgDuration: 22, pageviews: 56, sessions: 42 },
        duration: '22\u00a0s',
        perSession: '1,3 page par session',
      },
    ])(
      'formate la durée moyenne ($duration) et les pages par session ($perSession) en français',
      async ({ given, duration, perSession }) => {
        const { fixture } = await setup(
          makeAnalyticsGateway({ getOverview: () => of(overview(given)) }),
        );
        expect({
          duration: kpi(fixture, 'kpi-avg-duration'),
          perSession: kpi(fixture, 'kpi-pages-per-session'),
        }).toEqual({ duration, perSession });
      },
    );
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

describe('AdminAnalytics: un endpoint en erreur', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderFailing(overrides: Partial<AnalyticsGateway>): Promise<{
    fixture: ReturnType<typeof TestBed.createComponent<AdminAnalytics>>;
    host: HTMLElement;
    crash: unknown;
  }> {
    TestBed.configureTestingModule({
      providers: [{ provide: AnalyticsGateway, useValue: makeAnalyticsGateway(overrides) }],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminAnalytics);
    const crash = await captureCrash(async () => {
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
    });
    return { fixture, host: fixture.nativeElement as HTMLElement, crash };
  }

  const down = (): Observable<never> => throwError(() => new Error('down'));

  it.each<{ endpoint: string; overrides: Partial<AnalyticsGateway> }>([
    { endpoint: 'overview', overrides: { getOverview: down } },
    { endpoint: 'chart', overrides: { getChart: down } },
    { endpoint: 'metrics', overrides: { getMetrics: down } },
    { endpoint: 'project stats', overrides: { getProjectStats: down } },
    { endpoint: 'article read stats', overrides: { getArticleReadStats: down } },
  ])(
    'Given the $endpoint endpoint fails When the Audience page renders Then it shows one error state instead of throwing',
    async ({ overrides }) => {
      const { host, crash } = await renderFailing(overrides);

      expect({
        crash,
        errors: host.querySelectorAll('[data-testid="load-error"]').length,
      }).toEqual({ crash: null, errors: 1 });
    },
  );

  it('Given the overview endpoint failed once When Réessayer is pressed Then it is requested again and the error state goes away', async () => {
    const getOverview = vi
      .fn<AnalyticsGateway['getOverview']>()
      .mockReturnValueOnce(down())
      .mockReturnValue(of(overview()));
    const { fixture, host } = await renderFailing({ getOverview });
    const callsBefore = getOverview.mock.calls.length;

    const crash = await captureCrash(async () => {
      host.querySelector<HTMLButtonElement>('[data-testid="load-error-retry"]')?.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
    });

    expect({
      crash,
      retried: getOverview.mock.calls.length - callsBefore,
      errors: host.querySelectorAll('[data-testid="load-error"]').length,
    }).toEqual({ crash: null, retried: 1, errors: 0 });
  });
});

describe('AdminAnalytics: en-tête de page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const header = (host: HTMLElement): { overline: string; title: string; headings: number } => ({
    overline: testIdText(host, 'admin-page-overline'),
    title: testIdText(host, 'admin-page-title'),
    headings: host.querySelectorAll('h1').length,
  });

  it('Given Wednesday 7 October 2026 When the page opens on 30 days, then switches to 7 days Then the overline names the period shown', async () => {
    const { component, fixture } = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const initial = header(host);

    component.dateRange.set('7d');
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect({ initial, switched: header(host) }).toEqual({
      initial: {
        overline: '7 sept. au 7 oct. 2026 · 30 derniers jours',
        title: 'Audience',
        headings: 1,
      },
      switched: {
        overline: '30 sept. au 7 oct. 2026 · 7 derniers jours',
        title: 'Audience',
        headings: 1,
      },
    });
  });
});

describe('AdminAnalytics: courbe des visiteurs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given the Audience chart When it is built Then it draws straight lines in one hue, page views dashed', async () => {
    const { component } = await setup();

    expect(
      component.chartData().datasets.map((dataset) => ({
        label: dataset.label,
        tension: dataset.tension,
        borderDash: dataset.borderDash,
      })),
    ).toEqual([
      { label: 'Visiteurs', tension: 0, borderDash: undefined },
      { label: 'Pages vues', tension: 0, borderDash: [4, 4] },
    ]);
  });
});
