import { Component, inject, resource, computed, ChangeDetectionStrategy } from '@angular/core';
import type { SiteStats } from '../domain/models/stats.model';
import { SupabaseClientService } from '../../../shared/supabase/supabase-client';
import { toCamelCase } from '../../../shared/supabase/column-mapper';
import { UmamiService } from '../../../shared/umami/umami.service';

@Component({
  selector: 'app-admin-stats-hub',
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
            @if (umamiRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ umamiStats()?.visitors?.value ?? 0 }}
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
            @if (umamiRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ umamiStats()?.pageviews?.value ?? 0 }}
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
            @if (supabaseRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ supabaseStats()?.totalProjectClicks ?? 0 }}
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
            @if (supabaseRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">
                {{ supabaseStats()?.totalCvDownloads ?? 0 }}
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
            @if (umamiRes.isLoading()) {
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
            @if (umamiRes.isLoading()) {
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
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Page</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Vues</th>
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
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Source</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Visites</th>
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
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Navigateur</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Visites</th>
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
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Pays</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Visites</th>
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
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Titre</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">%</th>
            </tr>
          </thead>
          <tbody>
            @if (supabaseRes.isLoading()) {
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
              @for (article of sortedArticles(); track article.articleId) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground">{{ article.title }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ article.clicks }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">
                    {{ articlePercentage(article.clicks) }}%
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
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Titre</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">%</th>
            </tr>
          </thead>
          <tbody>
            @if (supabaseRes.isLoading()) {
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
              @for (project of sortedProjects(); track project.projectId) {
                <tr class="border-b border-foreground/5">
                  <td class="px-6 py-3 text-sm text-foreground">{{ project.title }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">{{ project.clicks }}</td>
                  <td class="px-6 py-3 text-sm text-muted text-right">
                    {{ projectPercentage(project.clicks) }}%
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
  private readonly supabase = inject(SupabaseClientService);
  private readonly umami = inject(UmamiService);

  private readonly thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  private readonly now = Date.now();

  readonly skeletonRows = [1, 2, 3];

  // Umami resources
  readonly umamiRes = resource({
    loader: () => this.umami.getStats(this.thirtyDaysAgo, this.now),
  });

  readonly activeRes = resource({
    loader: () => this.umami.getActive(),
  });

  readonly pagesRes = resource({
    loader: () => this.umami.getMetrics(this.thirtyDaysAgo, this.now, 'url'),
  });

  readonly referrersRes = resource({
    loader: () => this.umami.getMetrics(this.thirtyDaysAgo, this.now, 'referrer'),
  });

  readonly browsersRes = resource({
    loader: () => this.umami.getMetrics(this.thirtyDaysAgo, this.now, 'browser'),
  });

  readonly countriesRes = resource({
    loader: () => this.umami.getMetrics(this.thirtyDaysAgo, this.now, 'country'),
  });

  // Supabase resource
  readonly supabaseRes = resource({
    loader: async () => {
      const { data, error } = await this.supabase.client
        .from('site_stats')
        .select('*')
        .limit(1)
        .single();
      if (error) return null;
      return toCamelCase<SiteStats>(data);
    },
  });

  // Computed values
  readonly umamiStats = computed(() => this.umamiRes.value() ?? null);
  readonly supabaseStats = computed(() => this.supabaseRes.value() ?? null);
  readonly activeVisitors = computed(() => this.activeRes.value()?.visitors ?? 0);
  readonly pages = computed(() => this.pagesRes.value() ?? []);
  readonly referrers = computed(() => this.referrersRes.value() ?? []);
  readonly browsers = computed(() => this.browsersRes.value() ?? []);
  readonly countries = computed(() => this.countriesRes.value() ?? []);

  private readonly totalArticleClicks = computed(
    () => this.supabaseStats()?.totalArticleClicks ?? 0,
  );
  private readonly totalProjectClicks = computed(
    () => this.supabaseStats()?.totalProjectClicks ?? 0,
  );

  readonly sortedArticles = computed(() => {
    const articles = this.supabaseStats()?.articleStats ?? [];
    return [...articles].sort((a, b) => b.clicks - a.clicks);
  });

  readonly sortedProjects = computed(() => {
    const projects = this.supabaseStats()?.projectStats ?? [];
    return [...projects].sort((a, b) => b.clicks - a.clicks);
  });

  readonly bounceRate = computed(() => {
    const stats = this.umamiStats();
    if (!stats) return '0.0';
    const visits = stats.visits.value;
    if (visits === 0) return '0.0';
    return ((stats.bounces.value / visits) * 100).toFixed(1);
  });

  readonly avgTime = computed(() => {
    const stats = this.umamiStats();
    if (!stats) return '0s';
    const engaged = stats.visits.value - stats.bounces.value;
    if (engaged <= 0) return '0s';
    const seconds = Math.round(stats.totaltime.value / engaged);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  });

  articlePercentage(clicks: number): string {
    const total = this.totalArticleClicks();
    if (total === 0) return '0.0';
    return ((clicks / total) * 100).toFixed(1);
  }

  projectPercentage(clicks: number): string {
    const total = this.totalProjectClicks();
    if (total === 0) return '0.0';
    return ((clicks / total) * 100).toFixed(1);
  }
}
