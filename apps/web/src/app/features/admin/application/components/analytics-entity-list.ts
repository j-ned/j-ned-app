import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppSkeleton, AppTag, type AppTagSeverity } from '@shared/ui';
import { AppIcon } from '@shared/icons';
import type { EntityStat } from '@features/analytics/domain';

@Component({
  selector: 'app-analytics-entity-list',
  imports: [AppIcon, AppSkeleton, AppTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block bg-surface border border-foreground/10 rounded-xl p-6',
    'data-testid': 'entity-list',
  },
  template: `
    <header class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <app-icon [name]="icon()" [size]="20" [class]="iconClass()" />
        <h2 class="text-base font-semibold text-foreground">{{ title() }}</h2>
      </div>
      <app-tag [value]="tagValue()" [severity]="tagSeverity()" />
    </header>
    @if (loading()) {
      <div class="space-y-3">
        @for (_ of PLACEHOLDER_5; track $index) {
          <app-skeleton class="h-8 rounded" />
        }
      </div>
    } @else if (entities().length === 0) {
      <p class="text-sm text-muted text-center py-6" data-testid="empty">{{ emptyLabel() }}</p>
    } @else {
      <ul class="space-y-2" role="list">
        @for (row of entities(); track row.entityId) {
          <li class="flex items-center justify-between text-sm py-1" data-testid="entity-row">
            <span class="text-foreground truncate mr-3">{{ row.entityTitle }}</span>
            <span class="text-xs text-muted font-medium">{{ row.count }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class AnalyticsEntityList {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly iconClass = input<string>('text-primary');
  readonly tagValue = input.required<string>();
  readonly tagSeverity = input<AppTagSeverity>('info');
  readonly entities = input.required<readonly EntityStat[]>();
  readonly loading = input<boolean>(false);
  readonly emptyLabel = input<string>('Aucune donnée');

  protected readonly PLACEHOLDER_5 = [1, 2, 3, 4, 5] as const;
}
