import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js/auto';
import { AppChart, AppSkeleton } from '@shared/ui';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-analytics-donut-panel',
  imports: [AppIcon, AppSkeleton, AppChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block bg-surface border border-foreground/10 rounded-xl p-6',
    'data-testid': 'donut-panel',
  },
  template: `
    <header class="flex items-center gap-2 mb-4">
      <app-icon [name]="icon()" [size]="20" [class]="iconClass()" />
      <h2 class="text-base font-semibold text-foreground">{{ title() }}</h2>
    </header>
    @if (loading()) {
      <app-skeleton class="h-48 rounded" />
    } @else if (isEmpty()) {
      <p class="text-sm text-muted text-center py-6" data-testid="empty">Aucune donnée</p>
    } @else {
      <app-chart type="doughnut" [data]="data()" [options]="options()" height="12rem" />
    }
  `,
})
export class AnalyticsDonutPanel {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly iconClass = input<string>('text-primary');
  readonly data = input.required<ChartData>();
  readonly options = input.required<ChartOptions>();
  readonly loading = input<boolean>(false);
  readonly isEmpty = input<boolean>(false);
}
