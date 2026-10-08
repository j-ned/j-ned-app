import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChartData, ChartOptions } from 'chart.js';
import { counted } from '@shared/format/counted';
import { groupedNumber } from '@shared/format/grouped-number';
import { AppIcon } from '@shared/icons/app-icon';
import { AppChart } from '@shared/ui/chart';
import { AdminReadout, type ReadoutItem } from './admin-readout';
import { AdminSectionHead } from './admin-section-head';

@Component({
  selector: 'app-overview-audience',
  imports: [AdminSectionHead, RouterLink, AppIcon, AppChart, AdminReadout],
  host: { class: 'block' },
  template: `
    <section aria-labelledby="overview-audience-heading">
      <app-admin-section-head heading="Audience" headingId="overview-audience-heading">
        <a
          data-testid="overview-audience-link"
          routerLink="/admin/audience"
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Statistiques détaillées
          <app-icon name="arrow-right" [size]="14" />
        </a>
      </app-admin-section-head>

      @if (visitorsLabel(); as visitors) {
        <div
          class="grid items-end gap-3.5 pt-5.5 pb-4.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8"
        >
          <div>
            <p class="font-mono text-xs tracking-[0.06em] text-muted uppercase">Visiteurs · 30 j</p>
            <p
              data-testid="overview-visitors"
              class="mt-2 font-display text-[3.25rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums sm:text-[4rem]"
            >
              {{ visitors }}
            </p>
            <p data-testid="overview-sessions" class="mt-1.5 text-[0.8125rem] text-muted">
              {{ sessionsLabel() }}
            </p>
          </div>
          @if (chartData(); as data) {
            <figure class="min-w-0">
              <app-chart type="line" [data]="data" [options]="chartOptions()" height="7.5rem" />
              <figcaption class="sr-only">{{ chartSummary() }}</figcaption>
            </figure>
          }
        </div>
        <app-admin-readout [items]="readout()" />
      }
      <ng-content />
    </section>
  `,
})
export class OverviewAudience {
  readonly visitors = input.required<number | null>();
  readonly sessions = input.required<number | null>();
  readonly readout = input.required<readonly ReadoutItem[]>();
  readonly chartData = input.required<ChartData<'line'> | null>();
  readonly chartOptions = input<ChartOptions>();
  readonly chartSummary = input('');

  protected readonly visitorsLabel = computed(() => {
    const visitors = this.visitors();
    return visitors === null ? null : groupedNumber(visitors);
  });
  protected readonly sessionsLabel = computed(() => {
    const sessions = this.sessions() ?? 0;
    return counted(sessions, 'session', 'sessions');
  });
}
