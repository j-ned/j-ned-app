import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { DEVICE_EXCLUSION_STORAGE_KEY } from '@core/analytics/analytics-device-exclusion';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type {
  ActiveVisitors,
  DailyChartPoint,
  EntityStat,
  EventCount,
  EventCountType,
  MetricEntry,
} from '@features/analytics/domain/models/analytics.types';
import {
  makeChartPoint,
  makeConversions,
  makeEngagement,
  makeEntityStat,
  makeEventCount,
  makeMetricEntry,
  makeStatsOverview,
} from '@features/analytics/testing/analytics-builders';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { AppChart } from '@shared/ui/chart';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { AdminAudience } from './admin-audience';
import { AudienceChart } from '../../application/components/audience-chart';

type ChartHost = HTMLElement & {
  readonly data?: { readonly datasets: readonly Record<string, unknown>[] };
};

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

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

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

const sectionNamed = (host: HTMLElement, name: string): HTMLElement | null =>
  [...host.querySelectorAll<HTMLElement>('section[aria-labelledby]')].find(
    (section) =>
      normalized(host.querySelector(`[id="${section.getAttribute('aria-labelledby') ?? ''}"]`)) ===
      name,
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

    it('Given no active visitor When the page renders Then « 0 visite en ce moment » is plain text, not a live region', async () => {
      const { host } = await renderAudience();
      const live = byTestId(host, 'audience-active-visitors');

      expect({
        text: testIdText(host, 'audience-active-visitors'),
        ariaLive: live?.closest('[aria-live]') ?? null,
        status: live?.closest('[role="status"]') ?? null,
      }).toEqual({ text: '0 visite en ce moment', ariaLive: null, status: null });
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
    it('Given the production readout When the page opens Then its single h1 « Audience » sits under the 30-day period and a lead sentence', async () => {
      const { host } = await renderAudience();

      expect({
        overline: testIdText(host, 'admin-page-overline'),
        title: testIdText(host, 'admin-page-title'),
        headings: host.querySelectorAll('h1').length,
        lead: normalized(byTestId(host, 'audience-lead')),
      }).toEqual({
        overline: '7 sept. au 7 oct. 2026 · 30 derniers jours',
        title: 'Audience',
        headings: 1,
        lead: '42 visites, dont 18 venues de google.com. 4 sur 10 repartent en moins de 30\u00a0s, sans autre page ni action.',
      });
    });

    it('Given a tracked device When « Exclure cet appareil » is pressed, then pressed again Then the toggle says it is excluded, then offers to exclude it', async () => {
      const { fixture, host } = await renderAudience();
      const toggle = (): { pressed: string | null; text: string; tag: string | null } => {
        const element = byTestId(host, 'device-exclusion-toggle');
        return {
          pressed: element?.getAttribute('aria-pressed') ?? null,
          text: normalized(element),
          tag: element?.tagName ?? null,
        };
      };
      const initial = toggle();

      await press(fixture, byTestId(host, 'device-exclusion-toggle'));
      const excluded = toggle();
      await press(fixture, byTestId(host, 'device-exclusion-toggle'));

      expect({ initial, excluded, restored: toggle() }).toEqual({
        initial: { pressed: 'false', text: 'Exclure cet appareil', tag: 'BUTTON' },
        excluded: { pressed: 'true', text: 'Cet appareil est exclu', tag: 'BUTTON' },
        restored: { pressed: 'false', text: 'Exclure cet appareil', tag: 'BUTTON' },
      });
    });

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
    it('Given the page When it opens Then the period is a group of four toggles without counts, 30 days pressed', async () => {
      const { host } = await renderAudience();
      const options = [...host.querySelectorAll<HTMLElement>('[data-testid="filter-option"]')];

      expect({
        group: byTestId(host, 'filter-group')?.getAttribute('aria-label'),
        options: options.map((option) => ({
          label: testIdText(option, 'filter-option-label'),
          pressed: option.getAttribute('aria-pressed'),
        })),
        counts: host.querySelectorAll('[data-testid="filter-option-count"]').length,
      }).toEqual({
        group: 'Période',
        options: [
          { label: '7 jours', pressed: 'false' },
          { label: '30 jours', pressed: 'true' },
          { label: '90 jours', pressed: 'false' },
          { label: 'Depuis le début', pressed: 'false' },
        ],
        counts: 0,
      });
    });

    it.each([
      {
        label: '7 jours',
        overline: '30 sept. au 7 oct. 2026 · 7 derniers jours',
        period: ['2026-09-30', '2026-10-07'],
      },
      {
        label: 'Depuis le début',
        overline: 'Tout le temps',
        period: ['2026-04-26', '2026-10-07'],
      },
    ])(
      'Given the page on 30 days When « $label » is pressed Then the overline names the period and the figures are asked for it',
      async ({ label, overline, period }) => {
        const getOverview = vi.fn<AnalyticsGateway['getOverview']>(() => of(makeStatsOverview()));
        const { fixture, host } = await renderAudience(makeGateway({ getOverview }));

        await press(fixture, periodOption(host, label));

        expect({
          pressed: periodOption(host, label)?.getAttribute('aria-pressed'),
          overline: testIdText(host, 'admin-page-overline'),
          lastRequest: getOverview.mock.calls.at(-1),
          headings: host.querySelectorAll('h1').length,
        }).toEqual({ pressed: 'true', overline, lastRequest: period, headings: 1 });
      },
    );
  });

  describe('relevé', () => {
    const readout = (
      host: HTMLElement,
    ): readonly { label: string; value: string; detail: string }[] =>
      [...host.querySelectorAll<HTMLElement>('[data-testid="readout-item"]')].map((item) => ({
        label: normalized(item.querySelector('dt')),
        value: testIdText(item, 'readout-value'),
        detail: testIdText(item, 'readout-detail'),
      }));

    it('Given the production readout When the page renders Then visits, page views, both bounces and the measured duration are read out in French', async () => {
      const { host } = await renderAudience();

      expect(readout(host)).toEqual([
        { label: 'Visites', value: '42', detail: 'un appareil, une journée' },
        { label: 'Pages vues', value: '56', detail: '1,3 page par visite' },
        { label: 'Rebond (une page)', value: '88,1\u00a0%', detail: '37 visites sur 42' },
        { label: 'Rebond réel', value: '40,5\u00a0%', detail: 'engagement 59,5\u00a0%' },
        {
          label: 'Durée mesurée',
          value: '22\u00a0s',
          detail: 'par page, sur 62,5\u00a0% des pages vues',
        },
      ]);
    });

    it('Given 999 visits, 1 500 legacy visitors and a 12.34 % one-page bounce When the page renders Then they read « 999 » and « 12,3 % »', async () => {
      const { host } = await renderAudience(
        makeGateway({
          getOverview: () =>
            of(makeStatsOverview({ sessions: 999, visitors: 1500, bounceRate: 12.34 })),
        }),
      );
      const items = readout(host);

      expect({
        visits: items.find((item) => item.label === 'Visites')?.value,
        bounce: items.find((item) => item.label === 'Rebond (une page)')?.value,
      }).toEqual({ visits: '999', bounce: '12,3\u00a0%' });
    });

    it('Given an engagement measured from 12 September only When the 30-day readout renders Then the real bounce tile says since when', async () => {
      const { host } = await renderAudience(
        makeGateway({
          getOverview: () =>
            of(
              makeStatsOverview({
                engagement: makeEngagement({ measuredSince: '2026-09-12' }),
              }),
            ),
        }),
      );

      expect(readout(host).find((item) => item.label === 'Rebond réel')?.detail).toBe(
        'engagement 59,5\u00a0% · mesuré depuis le 12 septembre',
      );
    });

    it.each([
      {
        given: { avgDuration: 90, pageviews: 300, sessions: 100 },
        duration: '1\u00a0min 30\u00a0s',
        perSession: '3,0 pages par visite',
      },
      {
        given: { avgDuration: 22, pageviews: 56, sessions: 42 },
        duration: '22\u00a0s',
        perSession: '1,3 page par visite',
      },
    ])(
      'Given $given When the page renders Then the duration reads « $duration » and the page views « $perSession »',
      async ({ given, duration, perSession }) => {
        const { host } = await renderAudience(
          makeGateway({ getOverview: () => of(makeStatsOverview(given)) }),
        );
        const items = readout(host);

        expect({
          duration: items.find((item) => item.label === 'Durée mesurée')?.value,
          perSession: items.find((item) => item.label === 'Pages vues')?.detail,
        }).toEqual({ duration, perSession });
      },
    );
  });

  describe('sections', () => {
    it('Given the production readout When the page renders Then its sections are named by five h2 in reading order', async () => {
      const { host } = await renderAudience();

      expect([...host.querySelectorAll('h2')].map((heading) => normalized(heading))).toEqual([
        'Visites par jour',
        'Conversions',
        'Pages les plus vues',
        'Provenance',
        'Détail des visites',
      ]);
    });

    it('Given eight pages and three sources When the page renders Then the five first pages, the rest as « Autres », and the sources, direct access named', async () => {
      const { host } = await renderAudience();
      const rows = (section: HTMLElement | null): readonly (readonly string[])[] =>
        [...(section?.querySelectorAll<HTMLElement>('[data-testid="share-row"]') ?? [])].map(
          (row) => [
            testIdText(row, 'share-label'),
            testIdText(row, 'share-count'),
            testIdText(row, 'share-part'),
          ],
        );

      expect({
        pages: rows(sectionNamed(host, 'Pages les plus vues')),
        referrers: rows(sectionNamed(host, 'Provenance')),
      }).toEqual({
        pages: [
          ['/', '24', '43\u00a0%'],
          ['/blog', '6', '11\u00a0%'],
          ['/offres/site-vitrine', '6', '11\u00a0%'],
          ['/projects', '5', '9\u00a0%'],
          ['/about', '4', '7\u00a0%'],
          ['Autres', '11', '20\u00a0%'],
        ],
        referrers: [
          ['Accès direct', '20', '48\u00a0%'],
          ['google.com', '18', '43\u00a0%'],
          ['linkedin.com', '4', '10\u00a0%'],
        ],
      });
    });

    it('Given two days of visits When the page renders Then the curve draws straight lines in one hue, page views dashed, and its table has a row per day', async () => {
      const { host } = await renderAudience();
      const chart = host.querySelector<ChartHost>('app-chart');

      expect({
        datasets: (chart?.data?.datasets ?? []).map((dataset) => ({
          label: dataset['label'],
          tension: dataset['tension'],
          borderDash: dataset['borderDash'],
        })),
        rows: host.querySelectorAll('[data-testid="audience-chart-row"]').length,
        legend: normalized(byTestId(host, 'audience-chart-legend')),
      }).toEqual({
        datasets: [
          { label: 'Visites', tension: 0, borderDash: undefined },
          { label: 'Pages vues', tension: 0, borderDash: [4, 4] },
        ],
        rows: 2,
        legend: 'Visites Pages vues',
      });
    });

    it('Given the events of the period When the page renders Then what visitors do is told as named counts, one list per kind', async () => {
      const projects: EntityStat[] = [makeEntityStat({ entityTitle: 'Portfolio', count: 7 })];
      const read: EntityStat[] = [
        makeEntityStat({ entityId: 'signals', entityTitle: 'Signals', count: 1 }),
      ];
      const { host } = await renderAudience(
        makeGateway({
          getOverview: () =>
            of(
              makeStatsOverview({
                projectClicks: 7,
                articleViews: 6,
                ctaClicks: 3,
                cvDownloads: 0,
              }),
            ),
          getProjectStats: () => of(projects),
          getArticleReadStats: () => of(read),
        }),
      );
      const events = sectionNamed(host, 'Détail des visites');
      const groups = [
        ...(events?.querySelectorAll<HTMLElement>('[data-testid="audience-tally"]') ?? []),
      ];
      const group = (heading: string): HTMLElement | undefined =>
        groups.find((element) => testIdText(element, 'tally-heading') === heading);
      const rows = (element: HTMLElement | undefined): readonly (readonly string[])[] =>
        [...(element?.querySelectorAll<HTMLElement>('[data-testid="tally-row"]') ?? [])].map(
          (row) => [normalized(row.querySelector('dt')), normalized(row.querySelector('dd'))],
        );

      expect({
        headings: groups.map((element) => ({
          text: testIdText(element, 'tally-heading'),
          level: byTestId(element, 'tally-heading')?.tagName,
        })),
        totals: rows(group('Totaux')),
        projects: rows(group('Projets cliqués')),
        browsers: rows(group('Navigateurs')),
        articles: {
          rows: rows(group('Articles ouverts')),
          empty: testIdText(group('Articles ouverts') ?? host, 'tally-empty'),
        },
      }).toEqual({
        headings: [
          'Totaux',
          'Projets cliqués',
          'Articles ouverts',
          "Articles lus jusqu'au bout",
          'CTA cliqués',
          'Navigateurs',
          'Systèmes',
          'Pays',
        ].map((text) => ({ text, level: 'H3' })),
        totals: [
          ['Projets cliqués', '7'],
          ['Articles ouverts', '6'],
          ["Articles lus jusqu'au bout", '1'],
          ['CTA cliqués', '3'],
          ['CV téléchargés', '0'],
        ],
        projects: [['Portfolio', '7']],
        browsers: [
          ['Chrome', '26'],
          ['Inconnu', '3'],
        ],
        articles: { rows: [], empty: 'Rien sur la période.' },
      });
    });
  });

  describe('conversions', () => {
    const EVENT_COUNTS: Readonly<Record<EventCountType, readonly EventCount[]>> = {
      contact_submit: [
        makeEventCount({ entityId: 'home', count: 1 }),
        makeEventCount({ entityId: 'offer_site-vitrine', count: 1 }),
      ],
      outbound_click: [
        makeEventCount({ entityId: 'linkedin', count: 2 }),
        makeEventCount({ entityId: 'email', count: 1 }),
      ],
    };

    const tallies = (
      host: HTMLElement,
    ): readonly { heading: string; rows: readonly (readonly string[])[] }[] =>
      [
        ...(sectionNamed(host, 'Conversions')?.querySelectorAll<HTMLElement>(
          '[data-testid="audience-tally"]',
        ) ?? []),
      ].map((tally) => ({
        heading: testIdText(tally, 'tally-heading'),
        rows: [...tally.querySelectorAll<HTMLElement>('[data-testid="tally-row"]')].map((row) => [
          normalized(row.querySelector('dt')),
          normalized(row.querySelector('dd')),
        ]),
      }));

    it('Given measured conversions When the page renders Then the totals, the forms by placement and the links by channel are told', async () => {
      const { host } = await renderAudience(
        makeGateway({
          getOverview: () =>
            of(
              makeStatsOverview({
                cvDownloads: 4,
                conversions: makeConversions({
                  contactSubmits: 2,
                  contactClicks: 3,
                  profileClicks: 1,
                  demoClicks: 5,
                  contactSectionViews: 6,
                }),
              }),
            ),
          getEventCounts: (type) => of([...EVENT_COUNTS[type]]),
        }),
      );

      expect({
        note: byTestId(host, 'audience-conversions-note'),
        tallies: tallies(host),
      }).toEqual({
        note: null,
        tallies: [
          {
            heading: 'Totaux',
            rows: [
              ['Formulaires envoyés', '2'],
              ['Contacts directs', '3'],
              ['Profils ouverts', '1'],
              ['CV téléchargés', '4'],
              ['Démos ouvertes', '5'],
              ["Arrivées sur le formulaire de l'accueil", '6'],
            ],
          },
          {
            heading: 'Formulaires par emplacement',
            rows: [
              ['Accueil', '1'],
              ['Offre Site vitrine', '1'],
            ],
          },
          {
            heading: 'Liens par canal',
            rows: [
              ['LinkedIn', '2'],
              ['E-mail', '1'],
            ],
          },
        ],
      });
    });

    it('Given conversions never measured over the period When the page renders Then it says so and shows no zero', async () => {
      const { host } = await renderAudience(
        makeGateway({
          getOverview: () =>
            of(makeStatsOverview({ conversions: makeConversions({ measuredSince: null }) })),
        }),
      );

      expect({
        note: testIdText(host, 'audience-conversions-note'),
        tallies: tallies(host).length,
      }).toEqual({ note: 'Conversions non mesurées sur la période.', tallies: 0 });
    });

    it('Given the page on 30 days When « 90 jours » is pressed Then a note says the details cover the last 30 days at most', async () => {
      const { fixture, host } = await renderAudience(
        makeGateway({
          getOverview: () => of(makeStatsOverview({ detailSince: '2026-09-07' })),
        }),
      );
      const before = byTestId(host, 'audience-detail-note');

      await press(fixture, periodOption(host, '90 jours'));

      expect({ before, after: testIdText(host, 'audience-detail-note') }).toEqual({
        before: null,
        after:
          'Pages, provenances, actions et conversions par emplacement\u00a0: 30 derniers jours au plus, depuis le 7 septembre 2026.',
      });
    });
  });

  describe('chargement et erreur', () => {
    it('Given the overview is still loading When the page renders Then a placeholder announced as a status stands in for the readout', async () => {
      const { host } = await renderAudience(makeGateway({ getOverview: () => NEVER }));

      expect({
        role: byTestId(host, 'audience-loading')?.getAttribute('role') ?? null,
        readout: host.querySelectorAll('[data-testid="readout-item"]').length,
        errors: host.querySelectorAll('[data-testid="load-error"]').length,
      }).toEqual({ role: 'status', readout: 0, errors: 0 });
    });

    it.each<{ endpoint: string; overrides: Partial<AnalyticsGateway> }>([
      { endpoint: 'overview', overrides: { getOverview: down } },
      { endpoint: 'chart', overrides: { getChart: down } },
      { endpoint: 'metrics', overrides: { getMetrics: down } },
      { endpoint: 'project stats', overrides: { getProjectStats: down } },
      { endpoint: 'article read stats', overrides: { getArticleReadStats: down } },
      { endpoint: 'event counts', overrides: { getEventCounts: down } },
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
