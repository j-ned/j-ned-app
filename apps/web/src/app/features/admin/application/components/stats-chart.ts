import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
} from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import type { DailyChartPoint } from '@shared/analytics';

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
);

@Component({
  selector: 'app-stats-chart',
  imports: [BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <h3 class="text-sm font-semibold text-foreground mb-4">Visiteurs & Pages vues</h3>
      <div class="h-64">
        <canvas
          baseChart
          [datasets]="datasets()"
          [labels]="labels()"
          [options]="chartOptions"
          type="line"
        ></canvas>
      </div>
    </div>
  `,
})
export class StatsChart {
  readonly data = input.required<DailyChartPoint[]>();

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 10 },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.5)' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.7)' } },
    },
  };

  readonly labels = () => this.data().map((d) => d.date);

  readonly datasets = () => [
    {
      label: 'Visiteurs',
      data: this.data().map((d) => d.visitors),
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.3,
      fill: true,
    },
    {
      label: 'Pages vues',
      data: this.data().map((d) => d.pageviews),
      borderColor: 'rgb(244, 114, 182)',
      backgroundColor: 'rgba(244, 114, 182, 0.1)',
      tension: 0.3,
      fill: true,
    },
  ];
}
