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
import { AppChart, AppTag } from '@shared/ui';
import { catchError, EMPTY, firstValueFrom, interval, startWith, switchMap } from 'rxjs';
import { AnalyticsGateway } from '@features/analytics/domain';
import { AppIcon } from '@shared/icons';
import { ThemeWatcher } from '@shared/theme/theme-watcher';

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

type DateRangeKey = '7d' | '30d' | '90d' | 'all';

type DateRangeOption = {
  readonly value: DateRangeKey;
  readonly label: string;
};

@Component({
  selector: 'app-admin-analytics',
  imports: [FormsModule, AppChart, AppTag, AppIcon],
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
          @for (opt of dateRangeOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <button type="button" (click)="exportCsv()" class="btn-outline">
          <app-icon name="download" [size]="20" class="mr-2" />
          Export CSV
        </button>
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
          <div class="h-9 w-20 rounded bg-foreground/10 animate-pulse"></div>
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
          <div class="h-9 w-20 rounded bg-foreground/10 animate-pulse"></div>
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
          <div class="h-9 w-20 rounded bg-foreground/10 animate-pulse"></div>
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
          <div class="h-9 w-20 rounded bg-foreground/10 animate-pulse"></div>
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
        <div class="h-72 rounded bg-foreground/5 animate-pulse"></div>
      } @else {
        <app-chart type="line" [data]="chartData()" [options]="chartOptions()" height="18rem" />
      }
    </section>

    <!-- Top pages & Top referrers -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center gap-2 mb-4">
          <app-icon name="file" [size]="20" class="text-primary" />
          <h2 class="text-base font-semibold text-foreground">Pages les plus visitées</h2>
        </header>
        @if (pagesResource.isLoading()) {
          <div class="space-y-3">
            @for (_ of placeholder5; track $index) {
              <div class="h-8 rounded bg-foreground/5 animate-pulse"></div>
            }
          </div>
        } @else if (topPages().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucune donnée</p>
        } @else {
          <ul class="space-y-3" role="list">
            @for (row of topPages(); track row.name) {
              <li>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-foreground truncate mr-3">{{ row.name || '/' }}</span>
                  <span class="text-xs text-muted shrink-0 font-medium">{{ row.count }}</span>
                </div>
                <div class="h-1 rounded-full bg-foreground/5 overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full"
                    [style.width.%]="barWidth(row.count, pagesMax())"
                  ></div>
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center gap-2 mb-4">
          <app-icon name="external-link" [size]="20" class="text-primary" />
          <h2 class="text-base font-semibold text-foreground">Provenance du trafic</h2>
        </header>
        @if (referrersResource.isLoading()) {
          <div class="space-y-3">
            @for (_ of placeholder5; track $index) {
              <div class="h-8 rounded bg-foreground/5 animate-pulse"></div>
            }
          </div>
        } @else if (topReferrers().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucune donnée</p>
        } @else {
          <ul class="space-y-3" role="list">
            @for (row of topReferrers(); track row.name) {
              <li>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-foreground truncate mr-3">
                    {{ row.name || 'Accès direct' }}
                  </span>
                  <span class="text-xs text-muted shrink-0 font-medium">{{ row.count }}</span>
                </div>
                <div class="h-1 rounded-full bg-foreground/5 overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full"
                    [style.width.%]="barWidth(row.count, referrersMax())"
                  ></div>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </section>

    <!-- Breakdowns: Browsers / OS / Countries -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center gap-2 mb-4">
          <app-icon name="globe" [size]="20" class="text-primary" />
          <h2 class="text-base font-semibold text-foreground">Navigateurs</h2>
        </header>
        @if (browsersResource.isLoading()) {
          <div class="h-48 rounded bg-foreground/5 animate-pulse"></div>
        } @else if (browsers().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucune donnée</p>
        } @else {
          <app-chart
            type="doughnut"
            [data]="browsersChart()"
            [options]="donutOptions()"
            height="12rem"
          />
        }
      </div>

      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center gap-2 mb-4">
          <app-icon name="desktop" [size]="20" class="text-accent" />
          <h2 class="text-base font-semibold text-foreground">Systèmes d'exploitation</h2>
        </header>
        @if (osResource.isLoading()) {
          <div class="h-48 rounded bg-foreground/5 animate-pulse"></div>
        } @else if (osList().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucune donnée</p>
        } @else {
          <app-chart type="doughnut" [data]="osChart()" [options]="donutOptions()" height="12rem" />
        }
      </div>

      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center gap-2 mb-4">
          <app-icon name="map-marker" [size]="20" class="text-status-success" />
          <h2 class="text-base font-semibold text-foreground">Pays</h2>
        </header>
        @if (countriesResource.isLoading()) {
          <div class="space-y-3">
            @for (_ of placeholder5; track $index) {
              <div class="h-6 rounded bg-foreground/5 animate-pulse"></div>
            }
          </div>
        } @else if (countries().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucune donnée</p>
        } @else {
          <ul class="space-y-3" role="list">
            @for (row of countries(); track row.name) {
              <li>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-foreground truncate mr-3">{{ row.name || 'Inconnu' }}</span>
                  <span class="text-xs text-muted shrink-0 font-medium">{{ row.count }}</span>
                </div>
                <div class="h-1 rounded-full bg-foreground/5 overflow-hidden">
                  <div
                    class="h-full bg-status-success rounded-full"
                    [style.width.%]="barWidth(row.count, countriesMax())"
                  ></div>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </section>

    <!-- Conversions: projects + articles + CV -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <app-icon name="desktop" [size]="20" class="text-status-success" />
            <h2 class="text-base font-semibold text-foreground">Projets cliqués</h2>
          </div>
          <app-tag [value]="(overview()?.projectClicks ?? 0) + ' clics'" severity="success" />
        </header>
        @if (projectsResource.isLoading()) {
          <div class="space-y-3">
            @for (_ of placeholder5; track $index) {
              <div class="h-8 rounded bg-foreground/5 animate-pulse"></div>
            }
          </div>
        } @else if (topProjects().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucun clic enregistré</p>
        } @else {
          <ul class="space-y-2" role="list">
            @for (row of topProjectsTop5(); track row.entityId) {
              <li class="flex items-center justify-between text-sm py-1">
                <span class="text-foreground truncate mr-3">{{ row.entityTitle }}</span>
                <span class="text-xs text-muted font-medium">{{ row.count }}</span>
              </li>
            }
          </ul>
        }
      </div>

      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <header class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <app-icon name="pencil" [size]="20" class="text-primary" />
            <h2 class="text-base font-semibold text-foreground">Articles lus</h2>
          </div>
          <app-tag [value]="(overview()?.articleViews ?? 0) + ' vues'" severity="info" />
        </header>
        @if (articlesResource.isLoading()) {
          <div class="space-y-3">
            @for (_ of placeholder5; track $index) {
              <div class="h-8 rounded bg-foreground/5 animate-pulse"></div>
            }
          </div>
        } @else if (topArticles().length === 0) {
          <p class="text-sm text-muted text-center py-6">Aucune vue enregistrée</p>
        } @else {
          <ul class="space-y-2" role="list">
            @for (row of topArticlesTop5(); track row.entityId) {
              <li class="flex items-center justify-between text-sm py-1">
                <span class="text-foreground truncate mr-3">{{ row.entityTitle }}</span>
                <span class="text-xs text-muted font-medium">{{ row.count }}</span>
              </li>
            }
          </ul>
        }
      </div>

      <div
        class="bg-surface border border-foreground/10 rounded-xl p-6 flex flex-col justify-center items-center text-center"
      >
        <div
          class="icon-tile-lg bg-accent/10 mb-4"
        >
          <app-icon name="download" [size]="24" class="text-accent" />
        </div>
        <h2 class="text-base font-semibold text-foreground mb-1">CV téléchargés</h2>
        @if (overviewResource.isLoading()) {
          <div class="h-10 w-24 rounded bg-foreground/5 animate-pulse"></div>
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

  private alpha(color: string, pct: number): string {
    return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
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

  readonly dateRangeOptions: DateRangeOption[] = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: 'all', label: 'Tout le temps' },
  ];

  readonly dateRange = signal<DateRangeKey>('30d');
  readonly activeVisitors = signal(0);
  protected readonly placeholder5 = [1, 2, 3, 4, 5] as const;

  private readonly range = computed(() => {
    const key = this.dateRange();
    if (key === 'all') return { startDate: undefined, endDate: undefined };
    const days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  });

  // ── Overview KPIs ────────────────────────────────────────────────
  readonly overviewResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getOverview(params.startDate, params.endDate)),
  });
  readonly overview = computed(() => this.overviewResource.value());

  readonly formattedDuration = computed(() => {
    const sec = this.overview()?.avgDuration ?? 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
  });

  readonly pagesPerSession = computed(() => {
    const o = this.overview();
    if (!o || o.sessions === 0) return '0';
    return (o.pageviews / o.sessions).toFixed(1);
  });

  // ── Main chart ────────────────────────────────────────────────────
  readonly chartResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getChart(params.startDate, params.endDate)),
  });

  readonly chartData = computed(() => {
    const rows = this.chartResource.value() ?? [];
    const primary = this.themeColor('--theme-primary-text');
    const accent = this.themeColor('--theme-accent');
    return {
      labels: rows.map((r) => r.date),
      datasets: [
        {
          label: 'Visiteurs',
          data: rows.map((r) => r.visitors),
          borderColor: primary,
          backgroundColor: this.alpha(primary, 10),
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Pages vues',
          data: rows.map((r) => r.pageviews),
          borderColor: accent,
          backgroundColor: this.alpha(accent, 5),
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  });

  readonly chartOptions = computed(() => {
    const foreground = this.themeColor('--theme-foreground');
    const background = this.themeColor('--theme-background');
    const muted40 = this.alpha(foreground, 40);
    const grid = this.alpha(foreground, 6);
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' as const },
      scales: {
        x: {
          ticks: { color: muted40, maxTicksLimit: 8 },
          grid: { color: grid },
        },
        y: {
          beginAtZero: true,
          ticks: { color: muted40, precision: 0 },
          grid: { color: grid },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: this.alpha(background, 95),
          borderColor: this.alpha(foreground, 10),
          borderWidth: 1,
        },
      },
    };
  });

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
  readonly browsersChart = computed(() => ({
    labels: this.browsers().map((r) => r.name || 'Inconnu'),
    datasets: [
      {
        data: this.browsers().map((r) => r.count),
        backgroundColor: this.palette(),
        borderWidth: 0,
      },
    ],
  }));

  // ── OS ────────────────────────────────────────────────────────────
  readonly osResource = resource({
    params: () => this.range(),
    loader: ({ params }) =>
      firstValueFrom(this.analytics.getMetrics('os', params.startDate, params.endDate)),
  });
  readonly osList = computed(() => this.osResource.value()?.slice(0, 6) ?? []);
  readonly osChart = computed(() => ({
    labels: this.osList().map((r) => r.name || 'Inconnu'),
    datasets: [
      {
        data: this.osList().map((r) => r.count),
        backgroundColor: this.palette(),
        borderWidth: 0,
      },
    ],
  }));

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

  readonly donutOptions = computed(() => {
    const foreground = this.themeColor('--theme-foreground');
    const background = this.themeColor('--theme-background');
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: this.alpha(foreground, 70),
            boxWidth: 12,
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: this.alpha(background, 95),
          borderColor: this.alpha(foreground, 10),
          borderWidth: 1,
        },
      },
    };
  });

  // Palette dérivée des tokens du design system. Les séries au-delà
  // de primary/accent sont des variations d'opacité pour rester dans
  // la famille Signal Indigo (One Indigo Rule).
  private readonly palette = computed(() => {
    const primary = this.themeColor('--theme-primary-text');
    const accent = this.themeColor('--theme-accent');
    const success = this.themeColor('--theme-status-success');
    const warn = this.themeColor('--theme-status-warn');
    return [
      primary,
      accent,
      this.alpha(primary, 70),
      this.alpha(accent, 70),
      success,
      warn,
      this.alpha(primary, 40),
    ];
  });

  barWidth(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  exportCsv(): void {
    const rows: string[] = [];
    rows.push('Section,Label,Count');
    const o = this.overview();
    if (o) {
      rows.push(`KPI,Visiteurs,${o.visitors}`);
      rows.push(`KPI,Sessions,${o.sessions}`);
      rows.push(`KPI,Pages vues,${o.pageviews}`);
      rows.push(`KPI,Rebonds,${o.bounces}`);
      rows.push(`KPI,Taux de rebond (%),${o.bounceRate.toFixed(2)}`);
      rows.push(`KPI,Durée moyenne (s),${o.avgDuration}`);
      rows.push(`KPI,Clics projets,${o.projectClicks}`);
      rows.push(`KPI,Vues articles,${o.articleViews}`);
      rows.push(`KPI,Téléchargements CV,${o.cvDownloads}`);
    }
    for (const r of this.topPages()) rows.push(`Page,${this.escape(r.name)},${r.count}`);
    for (const r of this.topReferrers())
      rows.push(`Referrer,${this.escape(r.name || 'Direct')},${r.count}`);
    for (const r of this.browsers()) rows.push(`Navigateur,${this.escape(r.name)},${r.count}`);
    for (const r of this.osList()) rows.push(`OS,${this.escape(r.name)},${r.count}`);
    for (const r of this.countries())
      rows.push(`Pays,${this.escape(r.name || 'Inconnu')},${r.count}`);
    for (const r of this.topProjects())
      rows.push(`Projet,${this.escape(r.entityTitle)},${r.count}`);
    for (const r of this.topArticles())
      rows.push(`Article,${this.escape(r.entityTitle)},${r.count}`);

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${this.dateRange()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
