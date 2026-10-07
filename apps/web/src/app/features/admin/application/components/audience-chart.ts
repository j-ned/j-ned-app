import { Component, computed, input } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import { formatChartDay } from '@features/analytics/domain/analytics-presenter';
import type { DailyChartPoint } from '@features/analytics/domain/models/analytics.types';
import { AppChart } from '@shared/ui/chart';
import { chartSummary, groupedNumber } from '../overview-view';

@Component({
  selector: 'app-audience-chart',
  imports: [AppChart],
  host: { class: 'block' },
  template: `
    <figure class="mt-5 min-w-0">
      <app-chart type="line" [data]="data()" [options]="options()" height="15rem" />
      <figcaption class="sr-only">{{ caption() }}</figcaption>
    </figure>
    <details data-testid="audience-chart-data" class="mt-2">
      <summary
        class="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary"
      >
        Voir les données en tableau
      </summary>
      <div
        class="max-h-96 overflow-y-auto"
        tabindex="0"
        role="region"
        aria-label="Visites par jour"
      >
        <table data-testid="audience-chart-table" class="w-full max-w-lg border-collapse text-sm">
          <thead>
            <tr class="border-b-[1.5px] border-line-strong">
              <th scope="col" class="table-head pr-3 text-left">Jour</th>
              <th scope="col" class="table-head pl-3 text-right">Visiteurs</th>
              <th scope="col" class="table-head pl-3 text-right">Pages vues</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.date) {
              <tr data-testid="audience-chart-row" class="border-b border-line">
                <th scope="row" class="py-2 pr-3 text-left font-mono text-sm font-normal">
                  {{ row.day }}
                </th>
                <td class="py-2 pl-3 text-right font-mono tabular-nums">{{ row.visitors }}</td>
                <td class="py-2 pl-3 text-right font-mono tabular-nums">{{ row.pageviews }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </details>
  `,
})
export class AudienceChart {
  readonly points = input.required<readonly DailyChartPoint[]>();
  readonly data = input.required<ChartData<'line'>>();
  readonly options = input<ChartOptions>();

  protected readonly caption = computed(() => chartSummary(this.points()));
  protected readonly rows = computed(() =>
    this.points().map((point) => ({
      date: point.date,
      day: formatChartDay(point.date),
      visitors: groupedNumber(point.visitors),
      pageviews: groupedNumber(point.pageviews),
    })),
  );
}
