import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppSkeleton } from '@shared/ui/skeleton';
import { AppIcon } from '@shared/icons/app-icon';
import { barWidth } from '@features/analytics/domain/analytics-presenter';
import type { MetricEntry } from '@features/analytics/domain/models/analytics.types';

@Component({
  selector: 'app-analytics-bar-list',
  imports: [AppIcon, AppSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block bg-surface border border-foreground/10 rounded-xl p-6',
    'data-testid': 'bar-list',
  },
  template: `
    <header class="flex items-center gap-2 mb-4">
      <app-icon [name]="icon()" [size]="20" [class]="iconClass()" />
      <h2 class="text-base font-semibold text-foreground">{{ title() }}</h2>
    </header>
    @if (loading()) {
      <div class="space-y-3">
        @for (_ of PLACEHOLDER_5; track $index) {
          <app-skeleton [class]="skeletonClass()" />
        }
      </div>
    } @else if (rows().length === 0) {
      <p class="text-sm text-muted text-center py-6" data-testid="empty">{{ emptyLabel() }}</p>
    } @else {
      <ul class="space-y-3" role="list">
        @for (row of rows(); track row.name) {
          <li data-testid="bar-row">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-foreground truncate mr-3">{{ row.name || fallbackLabel() }}</span>
              <span class="text-xs text-muted shrink-0 font-medium">{{ row.count }}</span>
            </div>
            <div class="h-1 rounded-full bg-foreground/5 overflow-hidden">
              <div
                class="h-full rounded-full"
                [class]="barClass()"
                [style.width.%]="width(row.count)"
              ></div>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class AnalyticsBarList {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly iconClass = input<string>('text-primary');
  readonly rows = input.required<readonly MetricEntry[]>();
  readonly max = input.required<number>();
  readonly loading = input<boolean>(false);
  readonly emptyLabel = input<string>('Aucune donnée');
  readonly fallbackLabel = input<string>('');
  readonly barClass = input<string>('bg-primary');
  readonly skeletonClass = input<string>('h-8 rounded');

  protected readonly PLACEHOLDER_5 = [1, 2, 3, 4, 5] as const;

  protected width(count: number): number {
    return barWidth(count, this.max());
  }
}
