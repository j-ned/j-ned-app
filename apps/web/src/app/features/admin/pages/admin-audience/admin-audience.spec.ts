import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { of, throwError, type Observable } from 'rxjs';
import { DEVICE_EXCLUSION_STORAGE_KEY } from '@core/analytics/analytics-device-exclusion';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type {
  ActiveVisitors,
  DailyChartPoint,
  MetricEntry,
} from '@features/analytics/domain/models/analytics.types';
import {
  makeChartPoint,
  makeMetricEntry,
  makeStatsOverview,
} from '@features/analytics/testing/analytics-builders';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { AppChart } from '@shared/ui/chart';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { AdminAudience } from './admin-audience';
import { AudienceChart } from '../../application/components/audience-chart';

const METRICS: Readonly<Record<string, readonly MetricEntry[]>> = {
  url: [
    makeMetricEntry({ name: '/', count: 24 }),
    makeMetricEntry({ name: '/blog', count: 6 }),
    makeMetricEntry({ name: '/offres/site-vitrine', count: 6 }),
    makeMetricEntry({ name: '/projects', count: 5 }),
    makeMetricEntry({ name: '/about', count: 4 }),
    makeMetricEntry({ name: '/contact', count: 4 }),
    makeMetricEntry({ name: '/cv', count: 4 }),
    makeMetricEntry({ name: '/mentions-legales', count: 3 }),
  ],
  referrer: [
    makeMetricEntry({ name: '', count: 20 }),
    makeMetricEntry({ name: 'google.com', count: 18 }),
    makeMetricEntry({ name: 'linkedin.com', count: 4 }),
  ],
  browser: [
    makeMetricEntry({ name: 'Chrome', count: 26 }),
    makeMetricEntry({ name: '', count: 3 }),
  ],
};

const CHART: readonly DailyChartPoint[] = [
  makeChartPoint({ date: '2026-10-06', visitors: 6, pageviews: 9 }),
  makeChartPoint({ date: '2026-10-07', visitors: 2, pageviews: 3 }),
];

const metrics = (type: string): Observable<MetricEntry[]> => of([...(METRICS[type] ?? [])]);
const down = (): Observable<never> => throwError(() => new Error('down'));

function makeGateway(overrides: Partial<AnalyticsGateway> = {}): AnalyticsGateway {
  return stubAnalyticsGateway({
    getChart: () => of([...CHART]),
    getMetrics: metrics,
    ...overrides,
  });
}

async function advance(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await vi.advanceTimersByTimeAsync(0);
  fixture.detectChanges();
}

async function press(fixture: ComponentFixture<unknown>, element: Element | null): Promise<void> {
  const button = element?.tagName === 'BUTTON' ? element : element?.querySelector('button');
  if (button instanceof HTMLElement) button.click();
  await advance(fixture);
}

async function renderAudience(gateway: AnalyticsGateway = makeGateway()): Promise<{
  fixture: ComponentFixture<AdminAudience>;
  host: HTMLElement;
  crash: unknown;
}> {
  TestBed.configureTestingModule({ providers: [{ provide: AnalyticsGateway, useValue: gateway }] });
  TestBed.overrideComponent(AudienceChart, {
    remove: { imports: [AppChart] },
    add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(AdminAudience);
  const crash = await captureCrash(() => advance(fixture));
  return { fixture, host: fixture.nativeElement as HTMLElement, crash };
}

const periodOption = (host: HTMLElement, label: string): HTMLElement | null =>
  [...host.querySelectorAll<HTMLElement>('[data-testid="filter-option"]')].find(
    (option) => testIdText(option, 'filter-option-label') === label,
  ) ?? null;

describe('AdminAudience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
    localStorage.removeItem(DEVICE_EXCLUSION_STORAGE_KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(DEVICE_EXCLUSION_STORAGE_KEY);
  });

  describe('visites en ce moment', () => {
    it('Given 5 active visitors When the page opens Then « 5 visites en ce moment » shows at once, after a single request', async () => {
      const getActiveVisitors = vi.fn(() => of<ActiveVisitors>({ count: 5 }));
      const { host } = await renderAudience(makeGateway({ getActiveVisitors }));

      expect({
        text: testIdText(host, 'audience-active-visitors'),
        requests: getActiveVisitors.mock.calls.length,
      }).toEqual({ text: '5 visites en ce moment', requests: 1 });
    });

    it('Given the page is open When 30 s, then 30 s more go by Then the count is asked again each time and shown in the singular', async () => {
      let count = 1;
      const getActiveVisitors = vi.fn(() => of<ActiveVisitors>({ count: count++ }));
      const { fixture, host } = await renderAudience(makeGateway({ getActiveVisitors }));
      const first = testIdText(host, 'audience-active-visitors');

      await vi.advanceTimersByTimeAsync(30_000);
      fixture.detectChanges();
      const second = testIdText(host, 'audience-active-visitors');
      await vi.advanceTimersByTimeAsync(30_000);

      expect({ first, second, requests: getActiveVisitors.mock.calls.length }).toEqual({
        first: '1 visite en ce moment',
        second: '2 visites en ce moment',
        requests: 3,
      });
    });

    it('Given the page was open When it is destroyed Then the gateway is no longer polled', async () => {
      const getActiveVisitors = vi.fn(() => of<ActiveVisitors>({ count: 1 }));
      const { fixture } = await renderAudience(makeGateway({ getActiveVisitors }));

      fixture.destroy();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(getActiveVisitors).toHaveBeenCalledTimes(1);
    });
  });

  describe('en-tête', () => {
    it('Given the production readout When « Exporter en CSV » is pressed Then a CSV of the period is downloaded', async () => {
      const blobs: Blob[] = [];
      const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        if (blob instanceof Blob) blobs.push(blob);
        return 'blob:audience';
      });
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
      const downloads: string[] = [];
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        downloads.push(this.download);
      });
      const { fixture, host } = await renderAudience();

      await press(fixture, byTestId(host, 'analytics-export-csv'));
      const lines = blobs.length === 1 ? (await blobs[0].text()).split('\n') : [];

      expect({
        label: testIdText(host, 'analytics-export-csv'),
        downloads,
        revoked: revokeObjectURL.mock.calls,
        header: lines[0]?.replace('\uFEFF', ''),
        visitors: lines.includes('KPI,Visiteurs,42'),
        home: lines.includes('Page,/,24'),
        forms: lines.includes('KPI,Formulaires envoyés,0'),
      }).toEqual({
        label: 'Exporter en CSV',
        downloads: ['analytics-30d-2026-10-07.csv'],
        revoked: [['blob:audience']],
        header: 'Section,Label,Count',
        visitors: true,
        home: true,
        forms: true,
      });
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
      click.mockRestore();
    });
  });

  describe('période', () => {
    it.each([
      {
        label: '7 jours',
        period: ['2026-09-30', '2026-10-07'],
      },
      {
        label: 'Depuis le début',
        period: ['2026-04-26', '2026-10-07'],
      },
    ])(
      'Given the page on 30 days When « $label » is pressed Then the figures are asked for that period',
      async ({ label, period }) => {
        const getOverview = vi.fn<AnalyticsGateway['getOverview']>(() => of(makeStatsOverview()));
        const { fixture, host } = await renderAudience(makeGateway({ getOverview }));

        await press(fixture, periodOption(host, label));

        expect({
          pressed: periodOption(host, label)?.getAttribute('aria-pressed'),
          lastRequest: getOverview.mock.calls.at(-1),
        }).toEqual({ pressed: 'true', lastRequest: period });
      },
    );
  });

  describe('chargement et erreur', () => {
    it.each<{ endpoint: string; overrides: Partial<AnalyticsGateway> }>([
      { endpoint: 'overview', overrides: { getOverview: down } },
    ])(
      'Given the $endpoint endpoint fails When the page renders Then it shows one error state instead of throwing',
      async ({ overrides }) => {
        const { host, crash } = await renderAudience(makeGateway(overrides));

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
        .mockReturnValue(of(makeStatsOverview()));
      const { fixture, host } = await renderAudience(makeGateway({ getOverview }));
      const callsBefore = getOverview.mock.calls.length;

      const crash = await captureCrash(() => press(fixture, byTestId(host, 'load-error-retry')));

      expect({
        crash,
        retried: getOverview.mock.calls.length - callsBefore,
        errors: host.querySelectorAll('[data-testid="load-error"]').length,
        readout: host.querySelectorAll('[data-testid="readout-item"]').length,
      }).toEqual({ crash: null, retried: 1, errors: 0, readout: 5 });
    });
  });
});
