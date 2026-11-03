import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart, type ChartData } from 'chart.js';
import { AppChart } from './chart';

type Ctx2D = CanvasRenderingContext2D;

const noop = vi.fn();

function makeCtx(canvas: HTMLCanvasElement): Ctx2D {
  return new Proxy({} as Ctx2D, {
    get: (_, prop): unknown => {
      if (prop === 'canvas') return canvas;
      if (prop === 'measureText') {
        return (): TextMetrics =>
          ({
            width: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
          }) as TextMetrics;
      }
      if (prop === 'getLineDash') return (): number[] => [];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return (): { addColorStop: typeof noop } => ({ addColorStop: noop });
      }
      if (prop === 'createPattern') return (): null => null;
      if (prop === 'getImageData') {
        return (): ImageData =>
          ({
            data: new Uint8ClampedArray(),
            width: 0,
            height: 0,
          }) as ImageData;
      }
      if (prop === 'isPointInPath' || prop === 'isPointInStroke') return (): boolean => false;
      return noop;
    },
    set: (): boolean => true,
  });
}

beforeAll(() => {
  // Stub ResizeObserver: not implemented in jsdom
  (globalThis as unknown as Record<string, unknown>)['ResizeObserver'] = class {
    observe = noop;
    unobserve = noop;
    disconnect = noop;
  };

  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement): Ctx2D {
    return makeCtx(this);
  } as unknown as HTMLCanvasElement['getContext'];
});

describe('AppChart', () => {
  const lineData = (): ChartData => ({
    labels: ['Jan', 'Feb'],
    datasets: [{ label: 'A', data: [1, 2] }],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppChart] });
  });

  async function renderChart(props: {
    data: ChartData;
    height?: string;
  }): Promise<ComponentFixture<AppChart>> {
    const fixture = TestBed.createComponent(AppChart);
    fixture.componentRef.setInput('data', props.data);
    if (props.height) fixture.componentRef.setInput('height', props.height);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('creates a line Chart with the given data', async () => {
    const fixture = await renderChart({ data: lineData() });
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const chart = Chart.getChart(canvas);
    expect(chart).toBeDefined();
    expect((chart!.config as { type?: string }).type).toBe('line');
    expect(chart!.data.labels).toEqual(['Jan', 'Feb']);
  });

  it('destroys the previous Chart when data changes', async () => {
    const fixture = await renderChart({ data: lineData() });
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
    const fixture = await renderChart({ data: lineData() });
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const chart = Chart.getChart(canvas)!;
    const destroySpy = vi.spyOn(chart, 'destroy');

    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});
