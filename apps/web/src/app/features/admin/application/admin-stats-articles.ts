import { Component, inject, resource, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SiteStats } from '../domain/models/stats.model';
import { SupabaseClientService } from '../../../shared/supabase/supabase-client';
import { toCamelCase } from '../../../shared/supabase/column-mapper';

@Component({
  selector: 'app-admin-stats-articles',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-4 mb-8">
      <a
        routerLink="/admin/stats"
        class="p-2 rounded-lg hover:bg-foreground/5 transition-colors"
        aria-label="Retour aux statistiques"
      >
        <svg class="w-5 h-5 text-muted" aria-hidden="true">
          <use href="/icons/sprite.svg#lucide-arrow-left" />
        </svg>
      </a>
      <h1 class="text-2xl font-bold text-foreground">Statistiques articles</h1>
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <table class="w-full">
        <thead>
          <tr class="border-b border-foreground/10">
            <th class="text-left px-6 py-3 text-sm font-medium text-muted">Titre</th>
            <th class="text-right px-6 py-3 text-sm font-medium text-muted">Clics</th>
            <th class="text-right px-6 py-3 text-sm font-medium text-muted">% du total</th>
          </tr>
        </thead>
        <tbody>
          @if (statsRes.isLoading()) {
            @for (i of [1, 2, 3]; track i) {
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
                  {{ percentage(article.clicks) }}%
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="px-6 py-6 text-center text-muted text-sm">Aucune donnée</td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminStatsArticles {
  private readonly supabase = inject(SupabaseClientService);

  readonly statsRes = resource({
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

  private readonly stats = computed(() => this.statsRes.value() ?? null);
  private readonly totalClicks = computed(() => this.stats()?.totalArticleClicks ?? 0);

  readonly sortedArticles = computed(() => {
    const articles = this.stats()?.articleStats ?? [];
    return [...articles].sort((a, b) => b.clicks - a.clicks);
  });

  percentage(clicks: number): string {
    const total = this.totalClicks();
    if (total === 0) return '0.0';
    return ((clicks / total) * 100).toFixed(1);
  }
}
