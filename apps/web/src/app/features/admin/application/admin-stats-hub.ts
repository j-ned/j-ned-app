import { Component, inject, resource, computed, ChangeDetectionStrategy } from '@angular/core';
import { AnalyticsService } from '@shared/analytics';
import { StatsChart } from './components/stats-chart';

@Component({
  selector: 'app-admin-stats-hub',
  imports: [StatsChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Statistiques</h1>

    <!-- Vue d'ensemble -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-primary" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-users" />
            </svg>
          </div>
          <div>
            @if (overviewRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ overview()?.visitors ?? 0 }}
              </p>
            }
            <p class="text-sm text-muted">Visiteurs</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-accent" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-eye" />
            </svg>
          </div>
          <div>
            @if (overviewRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ overview()?.pageviews ?? 0 }}
              </p>
            }
            <p class="text-sm text-muted">Pages vues</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-green-500/20 to-green-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-green-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-laptop" />
            </svg>
          </div>
          <div>
            @if (overviewRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ overview()?.projectClicks ?? 0 }}
              </p>
            }
            <p class="text-sm text-muted">Clics projets</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-purple-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-file-text" />
            </svg>
          </div>
          <div>
            @if (overviewRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ overview()?.cvDownloads ?? 0 }}
              </p>
            }
            <p class="text-sm text-muted">Téléchargements CV</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-orange-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-log-out" />
            </svg>
          </div>
          <div>
            @if (overviewRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ bounceRate() }}%</p>
            }
            <p class="text-sm text-muted">Taux de rebond</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-blue-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-clock" />
            </svg>
          </div>
          <div>
            @if (overviewRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ avgTime() }}</p>
            }
            <p class="text-sm text-muted">Temps moyen</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-green-500/20 to-green-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-green-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-activity" />
            </svg>
          </div>
          <div>
            @if (activeRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ activeVisitors() }}</p>
            }
            <p class="text-sm text-muted">Actifs en temps réel</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart -->
    @if (chartRes.value(); as chartData) {
      <div class="mb-8">
        <app-stats-chart [data]="chartData" />
      </div>
    }

    <!-- Visites détaillées -->
    <h2 class="text-lg font-semibold text-foreground mb-4">Visites</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h3 class="text-sm font-semibold text-foreground">Top pages</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-3 text-sm font-medium text-muted">Page</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">Vues</th>
            </tr>
          </thead>
          <tbody>
            @if (pagesRes.isLoading()) {
              @for (i of skeletonRows; track i) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3">
                    <div class="h-4 w-48 rounded bg-foreground/10 animate-pulse"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-12 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                </tr>
              }
            } @else {
              @for (page of pages(); track page.x) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground truncate max-w-xs">{{ page.x }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ page.y }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h3 class="text-sm font-semibold text-foreground">Référents</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-3 text-sm font-medium text-muted">Source</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">
                Visites
              </th>
            </tr>
          </thead>
          <tbody>
            @if (referrersRes.isLoading()) {
              @for (i of skeletonRows; track i) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3">
                    <div class="h-4 w-48 rounded bg-foreground/10 animate-pulse"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-12 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                </tr>
              }
            } @else {
              @for (ref of referrers(); track ref.x) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground truncate max-w-xs">
                    {{ ref.x || 'Direct / Aucun' }}
                  </td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ ref.y }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h3 class="text-sm font-semibold text-foreground">Navigateurs</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-3 text-sm font-medium text-muted">
                Navigateur
              </th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">
                Visites
              </th>
            </tr>
          </thead>
          <tbody>
            @if (browsersRes.isLoading()) {
              @for (i of skeletonRows; track i) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3">
                    <div class="h-4 w-32 rounded bg-foreground/10 animate-pulse"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-12 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                </tr>
              }
            } @else {
              @for (browser of browsers(); track browser.x) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground">{{ browser.x }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ browser.y }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h3 class="text-sm font-semibold text-foreground">Pays</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-3 text-sm font-medium text-muted">Pays</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">
                Visites
              </th>
            </tr>
          </thead>
          <tbody>
            @if (countriesRes.isLoading()) {
              @for (i of skeletonRows; track i) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3">
                    <div class="h-4 w-32 rounded bg-foreground/10 animate-pulse"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-12 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                </tr>
              }
            } @else {
              @for (country of countries(); track country.x) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground">{{ country.x || 'Inconnu' }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ country.y }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Statistiques articles & projets -->
    <h2 class="text-lg font-semibold text-foreground mb-4">Articles & Projets</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h3 class="text-sm font-semibold text-foreground">Articles</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-3 text-sm font-medium text-muted">Titre</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">%</th>
            </tr>
          </thead>
          <tbody>
            @if (articleStatsRes.isLoading()) {
              @for (i of skeletonRows; track i) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3">
                    <div class="h-4 w-48 rounded bg-foreground/10 animate-pulse"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-12 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-16 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                </tr>
              }
            } @else {
              @for (article of sortedArticles(); track article.entityId) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground">{{ article.entityTitle }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ article.count }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">
                    {{ articlePercentages().get(article.entityId) ?? '0.0' }}%
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h3 class="text-sm font-semibold text-foreground">Projets</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-3 text-sm font-medium text-muted">Titre</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
              <th scope="col" class="text-right px-6 py-3 text-sm font-medium text-muted">%</th>
            </tr>
          </thead>
          <tbody>
            @if (projectStatsRes.isLoading()) {
              @for (i of skeletonRows; track i) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3">
                    <div class="h-4 w-48 rounded bg-foreground/10 animate-pulse"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-12 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                  <td class="px-6 py-3">
                    <div class="h-4 w-16 rounded bg-foreground/10 animate-pulse ml-auto"></div>
                  </td>
                </tr>
              }
            } @else {
              @for (project of sortedProjects(); track project.entityId) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground">{{ project.entityTitle }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ project.count }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">
                    {{ projectPercentages().get(project.entityId) ?? '0.0' }}%
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminStatsHub {
  private readonly analytics = inject(AnalyticsService);

  readonly skeletonRows = [1, 2, 3];

  // Overview resource (visitors, pageviews, bounces, duration, project/article/cv counts)
  readonly overviewRes = resource({
    loader: () => this.analytics.getOverview(),
  });

  readonly activeRes = resource({
    loader: () => this.analytics.getActiveVisitors(),
  });

  readonly chartRes = resource({
    loader: () => this.analytics.getChart(),
  });

  readonly pagesRes = resource({
    loader: () => this.analytics.getMetrics('url'),
  });

  readonly referrersRes = resource({
    loader: () => this.analytics.getMetrics('referrer'),
  });

  readonly browsersRes = resource({
    loader: () => this.analytics.getMetrics('browser'),
  });

  readonly countriesRes = resource({
    loader: () => this.analytics.getMetrics('country'),
  });

  readonly articleStatsRes = resource({
    loader: () => this.analytics.getArticleStats(),
  });

  readonly projectStatsRes = resource({
    loader: () => this.analytics.getProjectStats(),
  });

  // Computed values
  readonly overview = computed(() => this.overviewRes.value() ?? null);
  readonly activeVisitors = computed(() => this.activeRes.value()?.count ?? 0);

  readonly pages = computed(() =>
    (this.pagesRes.value() ?? []).map((m) => ({ x: m.name, y: m.count })),
  );
  readonly referrers = computed(() =>
    (this.referrersRes.value() ?? []).map((m) => ({ x: m.name, y: m.count })),
  );
  readonly browsers = computed(() =>
    (this.browsersRes.value() ?? []).map((m) => ({ x: m.name, y: m.count })),
  );
  readonly countries = computed(() =>
    (this.countriesRes.value() ?? []).map((m) => ({ x: m.name, y: m.count })),
  );

  readonly sortedArticles = computed(() => {
    const articles = this.articleStatsRes.value() ?? [];
    return [...articles].sort((a, b) => b.count - a.count);
  });

  readonly sortedProjects = computed(() => {
    const projects = this.projectStatsRes.value() ?? [];
    return [...projects].sort((a, b) => b.count - a.count);
  });

  private readonly totalArticleClicks = computed(() =>
    (this.articleStatsRes.value() ?? []).reduce((sum, a) => sum + a.count, 0),
  );

  private readonly totalProjectClicks = computed(() =>
    (this.projectStatsRes.value() ?? []).reduce((sum, p) => sum + p.count, 0),
  );

  readonly bounceRate = computed(() => {
    const o = this.overview();
    if (!o) return '0.0';
    return (o.bounceRate ?? 0).toFixed(1);
  });

  readonly avgTime = computed(() => {
    const o = this.overview();
    if (!o) return '0s';
    const seconds = o.avgDuration;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  });

  protected readonly articlePercentages = computed(() => {
    const articles = this.articleStatsRes.value() ?? [];
    const total = this.totalArticleClicks();
    const map = new Map<string, string>();
    for (const a of articles) {
      map.set(a.entityId, total === 0 ? '0.0' : ((a.count / total) * 100).toFixed(1));
    }
    return map;
  });

  protected readonly projectPercentages = computed(() => {
    const projects = this.projectStatsRes.value() ?? [];
    const total = this.totalProjectClicks();
    const map = new Map<string, string>();
    for (const p of projects) {
      map.set(p.entityId, total === 0 ? '0.0' : ((p.count / total) * 100).toFixed(1));
    }
    return map;
  });
}
