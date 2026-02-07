import { Component, resource, computed, ChangeDetectionStrategy } from '@angular/core';
import type { SiteStats } from '../domain/models/stats.model';
import { API_BASE_URL } from '../../../shared/api/api-config';

@Component({
  selector: 'app-admin-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-bold text-foreground mb-8">Statistiques</h1>

      <!-- Global stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center"
            >
              <svg class="w-7 h-7 text-primary" aria-hidden="true">
                <use href="/icons/sprite.svg#lucide-eye" />
              </svg>
            </div>
            <div>
              @if (statsRes.isLoading()) {
                <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground">{{ stats()?.totalVisits ?? 0 }}</p>
              }
              <p class="text-sm text-muted">Visites totales</p>
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
                <use href="/icons/sprite.svg#lucide-notebook-pen" />
              </svg>
            </div>
            <div>
              @if (statsRes.isLoading()) {
                <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground">
                  {{ stats()?.totalArticleClicks ?? 0 }}
                </p>
              }
              <p class="text-sm text-muted">Clics articles</p>
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
              @if (statsRes.isLoading()) {
                <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground">
                  {{ stats()?.totalProjectClicks ?? 0 }}
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
              @if (statsRes.isLoading()) {
                <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground">
                  {{ stats()?.totalCvDownloads ?? 0 }}
                </p>
              }
              <p class="text-sm text-muted">Téléchargements CV</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top articles -->
        <div
          class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg"
        >
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
                  <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Top projects -->
        <div
          class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg"
        >
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
                  <td colspan="2" class="px-6 py-6 text-center text-muted text-sm">
                    Aucune donnée
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminStats {
  readonly statsRes = resource({
    loader: () =>
      fetch(`${API_BASE_URL}/stats`)
        .then((res) => res.json() as Promise<SiteStats[]>)
        .then((data) => data[0] ?? null),
  });

  readonly stats = computed(() => this.statsRes.value() ?? null);
  readonly articleStats = computed(() => this.stats()?.articleStats ?? []);
  readonly projectStats = computed(() => this.stats()?.projectStats ?? []);
}
