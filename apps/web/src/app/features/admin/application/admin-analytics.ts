import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppChart } from '@shared/ui/chart';
import { Button } from '@shared/ui/button';
import { AppSkeleton } from '@shared/ui/skeleton';
import { AppIconTile } from '@shared/ui/icon-tile';
import { catchError, EMPTY, firstValueFrom, interval, startWith, switchMap } from 'rxjs';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import { ThemeWatcher } from '@shared/theme/theme-watcher';
import { AnalyticsBarList } from './components/analytics-bar-list';
import { AnalyticsDonutPanel } from './components/analytics-donut-panel';
import { AnalyticsEntityList } from './components/analytics-entity-list';
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

type DateRangeOption = {
  readonly value: DateRangeKey;
  readonly label: string;
};

@Component({
  selector: 'app-admin-analytics',
  imports: [
    FormsModule,
    AppChart,
    AppIcon,
    Button,
    AppSkeleton,
    AppIconTile,
    AnalyticsBarList,
    AnalyticsDonutPanel,
    AnalyticsEntityList,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <!-- Header avec date range et live -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-foreground mb-1">Analytics</h1>
        <p class="text-sm text-muted">Visites, engagement, provenance, appareils</p>
      </div>
      <div class="flex items-center gap-4">
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10"
        >
          <span class="relative flex items-center justify-center">
            <span
              class="absolute w-2 h-2 rounded-full bg-status-success animate-ping"
              aria-hidden="true"
            ></span>
            <span class="relative w-2 h-2 rounded-full bg-status-success" aria-hidden="true"></span>
          </span>
          <span class="text-xs font-medium text-foreground">
            {{ activeVisitors() }}
            {{ activeVisitors() > 1 ? 'visiteurs actifs' : 'visiteur actif' }}
          </span>
        </div>
        <select
          class="app-select"
          [ngModel]="dateRange()"
          (ngModelChange)="dateRange.set($event)"
          aria-label="Période d'analyse"
        >
          @for (opt of DATE_RANGE_OPTIONS; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <app-button severity="secondary" variant="outlined" (click)="exportCsv()">
          <app-icon name="download" [size]="20" />
          Export CSV
        </app-button>
      </div>
    </header>

    <!-- KPI cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label="Indicateurs clés">
      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="users" [size]="20" class="text-primary" />
          <span class="text-xs text-muted uppercase tracking-wider">Visiteurs</span>
        </div>
        @if (overviewResource.isLoading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">
            {{ overview()?.visitors ?? 0 }}
          </p>
          <p class="text-xs text-muted mt-2">{{ overview()?.sessions ?? 0 }} sessions</p>
        }
      </article>

      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="eye" [size]="20" class="text-primary" />
          <span class="text-xs text-muted uppercase tracking-wider">Pages vues</span>
        </div>
        @if (overviewResource.isLoading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">
            {{ overview()?.pageviews ?? 0 }}
          </p>
          <p class="text-xs text-muted mt-2">{{ pagesPerSession() }} pages / session</p>
        }
      </article>

      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="arrow-right-arrow-left" [size]="20" class="text-status-warn" />
          <span class="text-xs text-muted uppercase tracking-wider">Taux de rebond</span>
        </div>
        @if (overviewResource.isLoading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">
            {{ bounceRateFormatted() }}%
          </p>
          <p class="text-xs text-muted mt-2">{{ overview()?.bounces ?? 0 }} sessions en rebond</p>
        }
      </article>

      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="clock" [size]="20" class="text-status-success" />
          <span class="text-xs text-muted uppercase tracking-wider">Durée moyenne</span>
        </div>
        @if (overviewResource.isLoading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">{{ formattedDuration() }}</p>
          <p class="text-xs text-muted mt-2">par page</p>
        }
      </article>
    </section>

    <!-- Main chart -->
    <section class="bg-surface border border-foreground/10 rounded-xl p-6 mb-8">
      <header class="flex items-center justify-between mb-6">
        <h2 class="text-base font-semibold text-foreground">Évolution des visites</h2>
        <div class="flex items-center gap-4 text-xs">
          <span class="flex items-center gap-2 text-muted">
            <span class="w-3 h-0.5 rounded bg-primary" aria-hidden="true"></span>
            Visiteurs
          </span>
          <span class="flex items-center gap-2 text-muted">
            <span class="w-3 h-0.5 rounded bg-accent" aria-hidden="true"></span>
            Pages vues
          </span>
        </div>
      </header>
      @if (chartResource.isLoading()) {
        <app-skeleton class="h-72 rounded" />
      } @else {
        <app-chart type="line" [data]="chartData()" [options]="chartOptions()" height="18rem" />
      }
    </section>

    <!-- Top pages & Top referrers -->
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

    <!-- Breakdowns: Browsers / OS / Countries -->
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

    <!-- Conversions: projects + articles + CV -->
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

      <div
        class="bg-surface border border-foreground/10 rounded-xl p-6 flex flex-col justify-center items-center text-center"
      >
        <app-icon-tile size="lg" class="bg-accent/10 mb-4">
          <app-icon name="download" [size]="24" class="text-accent" />
        </app-icon-tile>
        <h2 class="text-base font-semibold text-foreground mb-1">CV téléchargés</h2>
        @if (overviewResource.isLoading()) {
          <app-skeleton class="h-10 w-24 rounded" />
        } @else {
          <p class="text-4xl font-bold text-foreground">{{ overview()?.cvDownloads ?? 0 }}</p>
        }
        <p class="text-xs text-muted mt-2">sur la période</p>
      </div>
    </section>
  `,
})
export class AdminAnalytics {
  private readonly analytics = inject(AnalyticsGateway);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _theme = inject(ThemeWatcher);

  private themeColor(token: keyof typeof THEME_FALLBACK | string): string {
    // Cree une dependency reactive sur le theme : les computed() qui
    // appellent themeColor() se re-evaluent quand dark/light bascule.
    this._theme.isDark();

    const fallback = THEME_FALLBACK[token] ?? 'oklch(50% 0 0)';
    if (!this._isBrowser) return fallback;
    const v = getComputedStyle(this._document.documentElement)
      .getPropertyValue(token)
      .trim();
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

  readonly DATE_RANGE_OPTIONS: DateRangeOption[] = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: 'all', label: 'Tout le temps' },
  ];

  readonly dateRange = signal<DateRangeKey>('30d');
  readonly activeVisitors = signal(0);

  private readonly range = computed(() => dateRangeToParams(this.dateRange(), new Date()));

  // ── Overview KPIs ────────────────────────────────────────────────
  readonly overviewResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getOverview(params.startDate, params.endDate)),
  });
  readonly overview = computed(() => this.overviewResource.value());

  readonly formattedDuration = computed(() => formatDuration(this.overview()?.avgDuration ?? 0));

  readonly pagesPerSession = computed(() => computePagesPerSession(this.overview()));

  // ── Main chart ────────────────────────────────────────────────────
  readonly chartResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getChart(params.startDate, params.endDate)),
  });

  readonly chartData = computed(() =>
    buildVisitorsChartData(
      this.chartResource.value() ?? [],
      this.themeColor('--theme-primary-text'),
      this.themeColor('--theme-accent'),
    ),
  );

  readonly chartOptions = computed(() =>
    buildLineChartOptions(this.themeColor('--theme-foreground'), this.themeColor('--theme-background')),
  );

  // ── Top pages ─────────────────────────────────────────────────────
  readonly pagesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('url', params.startDate, params.endDate)),
  });
  readonly topPages = computed(() => this.pagesResource.value()?.slice(0, 8) ?? []);
  readonly pagesMax = computed(() => Math.max(1, ...this.topPages().map((r) => r.count)));

  // ── Top referrers ─────────────────────────────────────────────────
  readonly referrersResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('referrer', params.startDate, params.endDate)),
  });
  readonly topReferrers = computed(() => this.referrersResource.value()?.slice(0, 8) ?? []);
  readonly referrersMax = computed(() => Math.max(1, ...this.topReferrers().map((r) => r.count)));

  // ── Browsers ──────────────────────────────────────────────────────
  readonly browsersResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('browser', params.startDate, params.endDate)),
  });
  readonly browsers = computed(() => this.browsersResource.value()?.slice(0, 6) ?? []);
  readonly browsersChart = computed(() => buildDonutChartData(this.browsers(), this.palette()));

  // ── OS ────────────────────────────────────────────────────────────
  readonly osResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('os', params.startDate, params.endDate)),
  });
  readonly osList = computed(() => this.osResource.value()?.slice(0, 6) ?? []);
  readonly osChart = computed(() => buildDonutChartData(this.osList(), this.palette()));

  // ── Countries ─────────────────────────────────────────────────────
  readonly countriesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('country', params.startDate, params.endDate)),
  });
  readonly countries = computed(() => this.countriesResource.value()?.slice(0, 8) ?? []);
  readonly countriesMax = computed(() => Math.max(1, ...this.countries().map((r) => r.count)));

  // ── Top projects ──────────────────────────────────────────────────
  readonly projectsResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getProjectStats(params.startDate, params.endDate)),
  });
  readonly topProjects = computed(() => this.projectsResource.value() ?? []);
  readonly topProjectsTop5 = computed(() => this.topProjects().slice(0, 5));

  // ── Top articles ──────────────────────────────────────────────────
  readonly articlesResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getArticleStats(params.startDate, params.endDate)),
  });
  readonly topArticles = computed(() => this.articlesResource.value() ?? []);
  readonly topArticlesTop5 = computed(() => this.topArticles().slice(0, 5));

  readonly bounceRateFormatted = computed(() => (this.overview()?.bounceRate ?? 0).toFixed(1));

  readonly donutOptions = computed(() =>
    buildDonutOptions(this.themeColor('--theme-foreground'), this.themeColor('--theme-background')),
  );

  private readonly palette = computed(() =>
    buildPalette({
      primary: this.themeColor('--theme-primary-text'),
      accent: this.themeColor('--theme-accent'),
      success: this.themeColor('--theme-status-success'),
      warn: this.themeColor('--theme-status-warn'),
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
