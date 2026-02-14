import { Component, inject, resource, computed, ChangeDetectionStrategy } from '@angular/core';
import type { SiteStats } from '../domain/models/stats.model';
import { SupabaseClientService } from '../../../shared/supabase/supabase-client';
import { toCamelCase } from '../../../shared/supabase/column-mapper';
import { UmamiService } from '../../../shared/umami/umami.service';

@Component({
  selector: 'app-admin-stats-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Statistiques</h1>

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

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h2 class="text-lg font-semibold text-foreground">Top articles</h2>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Article</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
            </tr>
          </thead>
          <tbody>
            @for (article of articleStats(); track article.articleId) {
              <tr class="border-b border-foreground/5">
                <td class="px-6 py-3 text-sm text-foreground">{{ article.title }}</td>
                <td class="px-6 py-3 text-sm text-muted text-right">{{ article.clicks }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">Aucune donnée</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h2 class="text-lg font-semibold text-foreground">Top projets</h2>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th class="text-left px-6 py-3 text-sm font-medium text-muted">Projet</th>
              <th class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
            </tr>
          </thead>
          <tbody>
            @for (project of projectStats(); track project.projectId) {
              <tr class="border-b border-foreground/5">
                <td class="px-6 py-3 text-sm text-foreground">{{ project.title }}</td>
                <td class="px-6 py-3 text-sm text-muted text-right">{{ project.clicks }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">Aucune donnée</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminStatsOverview {
  private readonly supabase = inject(SupabaseClientService);
  private readonly umami = inject(UmamiService);

  private readonly thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  private readonly now = Date.now();

  readonly umamiRes = resource({
    loader: () => this.umami.getStats(this.thirtyDaysAgo, this.now),
  });

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

  readonly umamiStats = computed(() => this.umamiRes.value() ?? null);
  readonly supabaseStats = computed(() => this.supabaseRes.value() ?? null);
  readonly articleStats = computed(() => this.supabaseStats()?.articleStats ?? []);
  readonly projectStats = computed(() => this.supabaseStats()?.projectStats ?? []);

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
}
