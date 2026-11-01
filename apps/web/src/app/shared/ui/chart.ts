import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  input,
  viewChild,
} from '@angular/core';
import { Chart, type ChartData, type ChartOptions, type ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `<canvas #canvas [style.height]="height()"></canvas>`,
})
export class AppChart implements OnDestroy {
  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartData>();
  readonly options = input<ChartOptions>();
  readonly height = input<string>('20rem');

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    afterRenderEffect({
      write: () => {
        const type = this.type();
        const data = this.data();
        const options = this.options();
        const el = this.canvasRef().nativeElement;

        this.chart?.destroy();
        this.chart = new Chart(el, { type, data, options });
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
