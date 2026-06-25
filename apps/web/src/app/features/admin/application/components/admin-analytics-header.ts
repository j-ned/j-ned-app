import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import type { DateRangeKey } from '@features/analytics/domain/analytics-presenter';

export type DateRangeOption = {
  readonly value: DateRangeKey;
  readonly label: string;
};

export const DATE_RANGE_OPTIONS: readonly DateRangeOption[] = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: 'all', label: 'Tout le temps' },
];

@Component({
  selector: 'app-admin-analytics-header',
  imports: [FormsModule, Button, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-foreground mb-1">Analytics</h1>
        <p class="text-sm text-muted">Visites, engagement, provenance, appareils</p>
      </div>
      <div class="flex items-center gap-4">
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10"
        >
          <span class="relative flex items-center justify-center">
            <span
              class="absolute w-2 h-2 rounded-full bg-status-success animate-ping"
              aria-hidden="true"
            ></span>
            <span
              class="relative w-2 h-2 rounded-full bg-status-success"
              aria-hidden="true"
            ></span>
          </span>
          <span class="text-xs font-medium text-foreground">
            {{ activeVisitors() }}
            {{ activeVisitors() > 1 ? 'visiteurs actifs' : 'visiteur actif' }}
          </span>
        </div>
        <select
          class="app-select"
          [ngModel]="dateRange()"
          (ngModelChange)="dateRangeChanged.emit($event)"
          aria-label="Période d'analyse"
        >
          @for (opt of DATE_RANGE_OPTIONS; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <app-button severity="secondary" variant="outlined" (click)="exportCsvClicked.emit()">
          <app-icon name="download" [size]="20" />
          Export CSV
        </app-button>
      </div>
    </header>
  `,
})
export class AdminAnalyticsHeader {
  protected readonly DATE_RANGE_OPTIONS = DATE_RANGE_OPTIONS;

  readonly activeVisitors = input<number>(0);
  readonly dateRange = input<DateRangeKey>('30d');

  readonly dateRangeChanged = output<DateRangeKey>();
  readonly exportCsvClicked = output<void>();
}
