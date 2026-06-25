import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import { AppChart } from '@shared/ui/chart';
import { AppSkeleton } from '@shared/ui/skeleton';

@Component({
  selector: 'app-admin-analytics-visitors-chart',
  imports: [AppChart, AppSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
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
      @if (loading()) {
        <app-skeleton class="h-72 rounded" />
      } @else {
        <app-chart type="line" [data]="data()" [options]="options()" height="18rem" />
      }
    </section>
  `,
})
export class AdminAnalyticsVisitorsChart {
  readonly loading = input<boolean>(false);
  readonly data = input<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly options = input<ChartOptions | undefined>(undefined);
}
