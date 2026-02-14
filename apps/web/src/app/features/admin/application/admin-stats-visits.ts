import { Component, inject, resource, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UmamiService } from '../../../shared/umami/umami.service';

@Component({
  selector: 'app-admin-stats-visits',
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
      <h1 class="text-2xl font-bold text-foreground">Visites détaillées</h1>
    </div>

    <div
      class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg mb-8"
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
            <p class="text-2xl font-bold text-foreground">
              {{ activeVisitors() }}
            </p>
          }
          <p class="text-sm text-muted">Visiteurs actifs en temps réel</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-foreground/10">
          <h2 class="text-lg font-semibold text-foreground">Top pages</h2>
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
          <h2 class="text-lg font-semibold text-foreground">Référents</h2>
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
          <h2 class="text-lg font-semibold text-foreground">Navigateurs</h2>
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
          <h2 class="text-lg font-semibold text-foreground">Pays</h2>
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
  `,
})
export class AdminStatsVisits {
  private readonly umami = inject(UmamiService);

  private readonly thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  private readonly now = Date.now();

  readonly skeletonRows = [1, 2, 3];

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

  readonly activeVisitors = computed(() => this.activeRes.value()?.visitors ?? 0);
  readonly pages = computed(() => this.pagesRes.value() ?? []);
  readonly referrers = computed(() => this.referrersRes.value() ?? []);
  readonly browsers = computed(() => this.browsersRes.value() ?? []);
  readonly countries = computed(() => this.countriesRes.value() ?? []);
}
