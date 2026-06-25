import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { catchError, EMPTY, firstValueFrom, interval, startWith, switchMap } from 'rxjs';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { ThemeWatcher } from '@shared/theme/theme-watcher';
import { AnalyticsBarList } from './components/analytics-bar-list';
import { AnalyticsDonutPanel } from './components/analytics-donut-panel';
import { AnalyticsEntityList } from './components/analytics-entity-list';
import { AdminAnalyticsHeader } from './components/admin-analytics-header';
import { AdminAnalyticsKpis } from './components/admin-analytics-kpis';
import { AdminAnalyticsVisitorsChart } from './components/admin-analytics-visitors-chart';
import { AdminAnalyticsCvPanel } from './components/admin-analytics-cv-panel';
import {
  dateRangeToParams,
  formatDuration,
  pagesPerSession as computePagesPerSession,
  buildVisitorsChartData,
  buildLineChartOptions,
  buildDonutChartData,
  buildDonutOptions,
  buildPalette,
  buildAnalyticsCsv,
  type DateRangeKey,
} from '@features/analytics/domain/analytics-presenter';

const THEME_FALLBACK: Record<string, string> = {
  '--theme-primary-text': 'oklch(74.5% 0.16 277)',
  '--theme-primary-bg': 'oklch(54% 0.225 277)',
  '--theme-accent': 'oklch(72% 0.157 296)',
  '--theme-foreground': 'oklch(98.5% 0.003 286)',
  '--theme-muted': 'oklch(70.4% 0.011 286)',
  '--theme-background': 'oklch(14.5% 0.003 286)',
  '--theme-status-success': 'oklch(72.3% 0.19 145)',
  '--theme-status-warn': 'oklch(76.6% 0.16 70)',
  '--theme-status-error': 'oklch(71.5% 0.18 22)',
};

type ChartPalette = {
  readonly primaryText: string;
  readonly accent: string;
  readonly foreground: string;
  readonly background: string;
  readonly success: string;
  readonly warn: string;
};

const DEFAULT_PALETTE: ChartPalette = {
  primaryText: THEME_FALLBACK['--theme-primary-text'],
  accent: THEME_FALLBACK['--theme-accent'],
  foreground: THEME_FALLBACK['--theme-foreground'],
  background: THEME_FALLBACK['--theme-background'],
  success: THEME_FALLBACK['--theme-status-success'],
  warn: THEME_FALLBACK['--theme-status-warn'],
};

@Component({
  selector: 'app-admin-analytics',
  imports: [
    AnalyticsBarList,
    AnalyticsDonutPanel,
    AnalyticsEntityList,
    AdminAnalyticsHeader,
    AdminAnalyticsKpis,
    AdminAnalyticsVisitorsChart,
    AdminAnalyticsCvPanel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-analytics-header
      [activeVisitors]="activeVisitors()"
      [dateRange]="dateRange()"
      (dateRangeChanged)="dateRange.set($event)"
      (exportCsvClicked)="exportCsv()"
    />

    <app-admin-analytics-kpis
      [loading]="overviewResource.isLoading()"
      [overview]="overview()"
      [pagesPerSession]="pagesPerSession()"
      [bounceRateFormatted]="bounceRateFormatted()"
      [formattedDuration]="formattedDuration()"
    />

    <app-admin-analytics-visitors-chart
      [loading]="chartResource.isLoading()"
      [data]="chartData()"
      [options]="chartOptions()"
    />

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      <app-analytics-bar-list
        title="Pages les plus visitées"
        icon="file"
        [rows]="topPages()"
        [max]="pagesMax()"
        [loading]="pagesResource.isLoading()"
        fallbackLabel="/"
      />
      <app-analytics-bar-list
        title="Provenance du trafic"
        icon="external-link"
        [rows]="topReferrers()"
        [max]="referrersMax()"
        [loading]="referrersResource.isLoading()"
        fallbackLabel="Accès direct"
      />
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <app-analytics-donut-panel
        title="Navigateurs"
        icon="globe"
        [data]="browsersChart()"
        [options]="donutOptions()"
        [loading]="browsersResource.isLoading()"
        [isEmpty]="browsers().length === 0"
      />
      <app-analytics-donut-panel
        title="Systèmes d'exploitation"
        icon="desktop"
        iconClass="text-accent"
        [data]="osChart()"
        [options]="donutOptions()"
        [loading]="osResource.isLoading()"
        [isEmpty]="osList().length === 0"
      />
      <app-analytics-bar-list
        title="Pays"
        icon="map-marker"
        iconClass="text-status-success"
        [rows]="countries()"
        [max]="countriesMax()"
        [loading]="countriesResource.isLoading()"
        fallbackLabel="Inconnu"
        barClass="bg-status-success"
        skeletonClass="h-6 rounded"
      />
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <app-analytics-entity-list
        title="Projets cliqués"
        icon="desktop"
        iconClass="text-status-success"
        [tagValue]="(overview()?.projectClicks ?? 0) + ' clics'"
        tagSeverity="success"
        [entities]="topProjectsTop5()"
        [loading]="projectsResource.isLoading()"
        emptyLabel="Aucun clic enregistré"
      />

      <app-analytics-entity-list
        title="Articles lus"
        icon="pencil"
        [tagValue]="(overview()?.articleViews ?? 0) + ' vues'"
        tagSeverity="info"
        [entities]="topArticlesTop5()"
        [loading]="articlesResource.isLoading()"
        emptyLabel="Aucune vue enregistrée"
      />

      <app-admin-analytics-cv-panel
        [loading]="overviewResource.isLoading()"
        [cvDownloads]="overview()?.cvDownloads ?? 0"
      />
    </section>
  `,
})
export class AdminAnalytics {
  private readonly analytics = inject(AnalyticsGateway);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _theme = inject(ThemeWatcher);

  private readonly _palette = signal<ChartPalette>(DEFAULT_PALETTE);

  private readonly _syncPalette = effect(() => {
    this._theme.isDark(); // reactive dependency – re-runs on theme switch
    if (!this._isBrowser) return;
    this._palette.set({
      primaryText: this._readVar('--theme-primary-text'),
      accent: this._readVar('--theme-accent'),
      foreground: this._readVar('--theme-foreground'),
      background: this._readVar('--theme-background'),
      success: this._readVar('--theme-status-success'),
      warn: this._readVar('--theme-status-warn'),
    });
  });

  private _readVar(token: string): string {
    const fallback = THEME_FALLBACK[token] ?? 'oklch(50% 0 0)';
    const v = getComputedStyle(this._document.documentElement).getPropertyValue(token).trim();
    return v || fallback;
  }

  constructor() {
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.analytics.getActiveVisitors().pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((r) => this.activeVisitors.set(r.count));
  }

  readonly dateRange = signal<DateRangeKey>('30d');
  readonly activeVisitors = signal(0);

  private readonly range = computed(() => dateRangeToParams(this.dateRange(), new Date()));

  readonly overviewResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getOverview(params.startDate, params.endDate)),
  });
  readonly overview = computed(() => this.overviewResource.value());

  readonly formattedDuration = computed(() => formatDuration(this.overview()?.avgDuration ?? 0));

  readonly pagesPerSession = computed(() => computePagesPerSession(this.overview()));

  readonly chartResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getChart(params.startDate, params.endDate)),
  });

  readonly chartData = computed(() =>
    buildVisitorsChartData(
      this.chartResource.value() ?? [],
      this._palette().primaryText,
      this._palette().accent,
    ),
  );

  readonly chartOptions = computed(() =>
    buildLineChartOptions(this._palette().foreground, this._palette().background),
  );

  readonly pagesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('url', params.startDate, params.endDate)),
  });
  readonly topPages = computed(() => this.pagesResource.value()?.slice(0, 8) ?? []);
  readonly pagesMax = computed(() => Math.max(1, ...this.topPages().map((r) => r.count)));

  readonly referrersResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('referrer', params.startDate, params.endDate)),
  });
  readonly topReferrers = computed(() => this.referrersResource.value()?.slice(0, 8) ?? []);
  readonly referrersMax = computed(() => Math.max(1, ...this.topReferrers().map((r) => r.count)));

  readonly browsersResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('browser', params.startDate, params.endDate)),
  });
  readonly browsers = computed(() => this.browsersResource.value()?.slice(0, 6) ?? []);
  readonly browsersChart = computed(() => buildDonutChartData(this.browsers(), this._buildPalette()));

  readonly osResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('os', params.startDate, params.endDate)),
  });
  readonly osList = computed(() => this.osResource.value()?.slice(0, 6) ?? []);
  readonly osChart = computed(() => buildDonutChartData(this.osList(), this._buildPalette()));

  readonly countriesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('country', params.startDate, params.endDate)),
  });
  readonly countries = computed(() => this.countriesResource.value()?.slice(0, 8) ?? []);
  readonly countriesMax = computed(() => Math.max(1, ...this.countries().map((r) => r.count)));

  readonly projectsResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getProjectStats(params.startDate, params.endDate)),
  });
  readonly topProjects = computed(() => this.projectsResource.value() ?? []);
  readonly topProjectsTop5 = computed(() => this.topProjects().slice(0, 5));

  readonly articlesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getArticleStats(params.startDate, params.endDate)),
  });
  readonly topArticles = computed(() => this.articlesResource.value() ?? []);
  readonly topArticlesTop5 = computed(() => this.topArticles().slice(0, 5));

  readonly bounceRateFormatted = computed(() => (this.overview()?.bounceRate ?? 0).toFixed(1));

  readonly donutOptions = computed(() =>
    buildDonutOptions(this._palette().foreground, this._palette().background),
  );

  private readonly _buildPalette = computed(() =>
    buildPalette({
      primary: this._palette().primaryText,
      accent: this._palette().accent,
      success: this._palette().success,
      warn: this._palette().warn,
    }),
  );

  exportCsv(): void {
    const content = buildAnalyticsCsv({
      overview: this.overview(),
      topPages: this.topPages(),
      topReferrers: this.topReferrers(),
      browsers: this.browsers(),
      osList: this.osList(),
      countries: this.countries(),
      topProjects: this.topProjects(),
      topArticles: this.topArticles(),
    });

    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${this.dateRange()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
