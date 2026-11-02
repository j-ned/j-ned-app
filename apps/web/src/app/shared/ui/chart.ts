import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  input,
  viewChild,
} from '@angular/core';
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

// Courbes seules : `chart.js/auto` enregistrerait tous les types de graphique (environ 11 kB gzip de plus).
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `<canvas #canvas [style.height]="height()"></canvas>`,
})
export class AppChart implements OnDestroy {
  readonly data = input.required<ChartData>();
  readonly options = input<ChartOptions>();
  readonly height = input<string>('20rem');

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    afterRenderEffect({
      write: () => {
        const data = this.data();
        const options = this.options();
        const el = this.canvasRef().nativeElement;

        this.chart?.destroy();
        this.chart = new Chart(el, { type: 'line', data, options });
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
