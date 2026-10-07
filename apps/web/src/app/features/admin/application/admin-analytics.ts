import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  inject,
  resource,
  signal,
  type ResourceRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { catchError, EMPTY, firstValueFrom, interval, startWith, switchMap } from 'rxjs';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { AnalyticsDeviceExclusion } from '@core/analytics/analytics-device-exclusion';
import { ThemeStore } from '@core/theme/theme-store';
import { LoadError } from '@shared/ui/load-error';
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
  formatPercent,
  pagesPerSessionLabel,
  buildVisitorsChartData,
  buildLineChartOptions,
  buildDonutChartData,
  buildDonutOptions,
  buildPalette,
  buildAnalyticsCsv,
  type DateRangeKey,
  type LinePalette,
} from '@features/analytics/domain/analytics-presenter';
import { readChartPalette, readThemeColor } from './chart-palette';

type ChartPalette = {
  readonly line: LinePalette;
  readonly accent: string;
  readonly background: string;
  readonly success: string;
  readonly warn: string;
};

// `value()` lève en état d'erreur : toute lecture de ressource passe par `hasValue()`.
function valueOr<T, F>(source: ResourceRef<T | undefined>, fallback: F): T | F {
  return source.hasValue() ? source.value() : fallback;
}

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
    LoadError,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-analytics-header
      [activeVisitors]="activeVisitors()"
      [dateRange]="dateRange()"
      [deviceExcluded]="deviceExclusion.excluded()"
      (dateRangeChanged)="dateRange.set($event)"
      (exportCsvClicked)="exportCsv()"
      (deviceExclusionToggled)="deviceExclusion.toggle()"
    />

    @if (hasLoadError()) {
      <app-load-error
        message="Une partie des statistiques n'a pas pu être chargée."
        (retry)="retryFailed()"
      />
    } @else {
      <app-admin-analytics-kpis
        [loading]="overviewResource.isLoading()"
        [overview]="overview()"
        [pagesPerSessionLabel]="pagesPerSessionLabel()"
        [bounceRate]="bounceRate()"
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

      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <app-analytics-entity-list
          title="Projets cliqués"
          icon="desktop"
          iconClass="text-status-success"
          [tagValue]="(overview()?.projectClicks ?? 0) + ' clics'"
          [entities]="topProjectsTop5()"
          [loading]="projectsResource.isLoading()"
          emptyLabel="Aucun clic enregistré"
        />

        <app-analytics-entity-list
          title="Articles ouverts"
          icon="pencil"
          [tagValue]="(overview()?.articleViews ?? 0) + ' vues'"
          [entities]="topArticlesTop5()"
          [loading]="articlesResource.isLoading()"
          emptyLabel="Aucune vue enregistrée"
        />

        <app-analytics-entity-list
          title="Articles lus jusqu'au bout"
          icon="check-circle"
          iconClass="text-accent"
          [tagValue]="articlesReadTotal() + ' lectures'"
          [entities]="topArticlesReadTop5()"
          [loading]="articlesReadResource.isLoading()"
          emptyLabel="Aucune lecture complète enregistrée"
        />

        <app-analytics-entity-list
          title="CTA cliqués"
          icon="arrow-right"
          iconClass="text-primary"
          [tagValue]="(overview()?.ctaClicks ?? 0) + ' clics'"
          [entities]="topCtaTop5()"
          [loading]="ctaResource.isLoading()"
          emptyLabel="Aucun clic enregistré"
        />

        <app-admin-analytics-cv-panel
          [loading]="overviewResource.isLoading()"
          [cvDownloads]="overview()?.cvDownloads ?? 0"
        />
      </section>
    }
  `,
})
export class AdminAnalytics {
  private readonly analytics = inject(AnalyticsGateway);
  protected readonly deviceExclusion = inject(AnalyticsDeviceExclusion);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _isDark = inject(ThemeStore).isDark;

  // Les couleurs viennent des variables CSS du registre courant : relues à chaque bascule de thème.
  private readonly _palette = computed<ChartPalette>(() => {
    this._isDark();
    return {
      line: readChartPalette(this._document),
      accent: readThemeColor(this._document, '--theme-accent'),
      background: readThemeColor(this._document, '--theme-background', 'Canvas'),
      success: readThemeColor(this._document, '--theme-status-success'),
      warn: readThemeColor(this._document, '--theme-status-warn'),
    };
  });

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
  readonly overview = computed(() => valueOr(this.overviewResource, undefined));

  readonly formattedDuration = computed(() => formatDuration(this.overview()?.avgDuration ?? 0));

  readonly pagesPerSessionLabel = computed(() => pagesPerSessionLabel(this.overview()));

  readonly chartResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getChart(params.startDate, params.endDate)),
  });

  readonly chartData = computed(() =>
    buildVisitorsChartData(valueOr(this.chartResource, []), this._palette().line),
  );

  readonly chartOptions = computed(() =>
    buildLineChartOptions(this._palette().line.foreground, this._palette().background),
  );

  readonly pagesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('url', params.startDate, params.endDate)),
  });
  readonly topPages = computed(() => valueOr(this.pagesResource, []).slice(0, 8));
  readonly pagesMax = computed(() => Math.max(1, ...this.topPages().map((r) => r.count)));

  readonly referrersResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('referrer', params.startDate, params.endDate)),
  });
  readonly topReferrers = computed(() => valueOr(this.referrersResource, []).slice(0, 8));
  readonly referrersMax = computed(() => Math.max(1, ...this.topReferrers().map((r) => r.count)));

  readonly browsersResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('browser', params.startDate, params.endDate)),
  });
  readonly browsers = computed(() => valueOr(this.browsersResource, []).slice(0, 6));
  readonly browsersChart = computed(() =>
    buildDonutChartData(this.browsers(), this._buildPalette()),
  );

  readonly osResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('os', params.startDate, params.endDate)),
  });
  readonly osList = computed(() => valueOr(this.osResource, []).slice(0, 6));
  readonly osChart = computed(() => buildDonutChartData(this.osList(), this._buildPalette()));

  readonly countriesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('country', params.startDate, params.endDate)),
  });
  readonly countries = computed(() => valueOr(this.countriesResource, []).slice(0, 8));
  readonly countriesMax = computed(() => Math.max(1, ...this.countries().map((r) => r.count)));

  readonly projectsResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getProjectStats(params.startDate, params.endDate)),
  });
  readonly topProjects = computed(() => valueOr(this.projectsResource, []));
  readonly topProjectsTop5 = computed(() => this.topProjects().slice(0, 5));

  readonly articlesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getArticleStats(params.startDate, params.endDate)),
  });
  readonly topArticles = computed(() => valueOr(this.articlesResource, []));
  readonly topArticlesTop5 = computed(() => this.topArticles().slice(0, 5));

  readonly ctaResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getCtaStats(params.startDate, params.endDate)),
  });
  readonly topCta = computed(() => valueOr(this.ctaResource, []));
  readonly topCtaTop5 = computed(() => this.topCta().slice(0, 5));

  readonly articlesReadResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getArticleReadStats(params.startDate, params.endDate)),
  });
  readonly topArticlesRead = computed(() => valueOr(this.articlesReadResource, []));
  readonly topArticlesReadTop5 = computed(() => this.topArticlesRead().slice(0, 5));
  readonly articlesReadTotal = computed(() =>
    this.topArticlesRead().reduce((sum, r) => sum + r.count, 0),
  );

  readonly bounceRate = computed(() => formatPercent(this.overview()?.bounceRate ?? 0));

  private readonly _sources: readonly ResourceRef<unknown>[] = [
    this.overviewResource,
    this.chartResource,
    this.pagesResource,
    this.referrersResource,
    this.browsersResource,
    this.osResource,
    this.countriesResource,
    this.projectsResource,
    this.articlesResource,
    this.ctaResource,
    this.articlesReadResource,
  ];
  private readonly _failedSources = computed(() =>
    this._sources.filter((source) => source.status() === 'error'),
  );
  protected readonly hasLoadError = computed(() => this._failedSources().length > 0);

  readonly donutOptions = computed(() =>
    buildDonutOptions(this._palette().line.foreground, this._palette().background),
  );

  private readonly _buildPalette = computed(() =>
    buildPalette({
      primary: this._palette().line.primary,
      accent: this._palette().accent,
      success: this._palette().success,
      warn: this._palette().warn,
    }),
  );

  protected retryFailed(): void {
    this._failedSources().forEach((source) => source.reload());
  }

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
      topArticlesRead: this.topArticlesRead(),
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
