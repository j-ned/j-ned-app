import { TestBed } from '@angular/core/testing';
import { Chart, type ChartData } from 'chart.js/auto';
import { AppChart } from './chart';

type Ctx2D = CanvasRenderingContext2D;

function makeCtx(canvas: HTMLCanvasElement): Ctx2D {
  return new Proxy({} as Ctx2D, {
    get: (_, prop) => {
      if (prop === 'canvas') return canvas;
      if (prop === 'measureText') {
        return () => ({
          width: 0,
          actualBoundingBoxAscent: 0,
          actualBoundingBoxDescent: 0,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: 0,
        });
      }
      if (prop === 'getLineDash') return () => [];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: () => {} });
      }
      if (prop === 'createPattern') return () => null;
      if (prop === 'getImageData') {
        return () => ({ data: new Uint8ClampedArray(), width: 0, height: 0 });
      }
      if (prop === 'isPointInPath' || prop === 'isPointInStroke') return () => false;
      return () => {};
    },
    set: () => true,
  });
}

beforeAll(() => {
  // Stub ResizeObserver — not implemented in jsdom
  (globalThis as unknown as Record<string, unknown>)['ResizeObserver'] = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  HTMLCanvasElement.prototype.getContext = (function (this: HTMLCanvasElement) {
    return makeCtx(this);
  } as unknown) as HTMLCanvasElement['getContext'];
});

describe('AppChart', () => {
  const lineData = (): ChartData => ({
    labels: ['Jan', 'Feb'],
    datasets: [{ label: 'A', data: [1, 2] }],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppChart] });
  });

  async function renderChart(props: { type: 'line' | 'doughnut'; data: ChartData; height?: string }) {
    const fixture = TestBed.createComponent(AppChart);
    fixture.componentRef.setInput('type', props.type);
    fixture.componentRef.setInput('data', props.data);
    if (props.height) fixture.componentRef.setInput('height', props.height);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('creates a Chart with the given type and data', async () => {
    const fixture = await renderChart({ type: 'line', data: lineData() });
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const chart = Chart.getChart(canvas);
    expect(chart).toBeDefined();
    expect((chart!.config as { type?: string }).type).toBe('line');
    expect(chart!.data.labels).toEqual(['Jan', 'Feb']);
  });

  it('destroys the previous Chart when data changes', async () => {
    const fixture = await renderChart({ type: 'line', data: lineData() });
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const firstChart = Chart.getChart(canvas)!;
    const destroySpy = vi.spyOn(firstChart, 'destroy');

    fixture.componentRef.setInput('data', {
      labels: ['Mar'],
      datasets: [{ label: 'B', data: [3] }],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('destroys the Chart on ngOnDestroy', async () => {
    const fixture = await renderChart({ type: 'doughnut', data: lineData() });
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const chart = Chart.getChart(canvas)!;
    const destroySpy = vi.spyOn(chart, 'destroy');

    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('applies the height input to the canvas style', async () => {
    // responsive: false prevents Chart.js from overwriting canvas.style.height
    // (Chart._resize forcibly sets style.height to '0px' in jsdom where layout is unavailable)
    const fixture = TestBed.createComponent(AppChart);
    fixture.componentRef.setInput('type', 'line');
    fixture.componentRef.setInput('data', lineData());
    fixture.componentRef.setInput('height', '15rem');
    fixture.componentRef.setInput('options', { responsive: false });
    fixture.detectChanges();
    await fixture.whenStable();
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.height).toBe('15rem');
  });
});
