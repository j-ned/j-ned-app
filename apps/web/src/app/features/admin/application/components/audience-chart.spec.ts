import { CUSTOM_ELEMENTS_SCHEMA, inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChartData } from 'chart.js';
import type { DailyChartPoint } from '@features/analytics/domain/models/analytics.types';
import { makeChartPoint } from '@features/analytics/testing/analytics-builders';
import { AppChart } from '@shared/ui/chart';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AudienceChart } from './audience-chart';

const POINTS: readonly DailyChartPoint[] = [
  makeChartPoint({ date: '2026-09-07', visitors: 6, pageviews: 9 }),
  makeChartPoint({ date: '2026-09-08', visitors: 2, pageviews: 1500 }),
];

const CHART_DATA: ChartData<'line'> = {
  labels: ['7 sept.', '8 sept.'],
  datasets: [{ label: 'Visiteurs', data: [6, 2] }],
};

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

async function renderChart(points: readonly DailyChartPoint[]): Promise<HTMLElement> {
  TestBed.overrideComponent(AudienceChart, {
    remove: { imports: [AppChart] },
    add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(AudienceChart, {
    bindings: [inputBinding('points', () => points), inputBinding('data', () => CHART_DATA)],
  });
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe('AudienceChart', () => {
  it('Given two days of visits When the data table renders Then it has one row per day, the day as row header', async () => {
    const host = await renderChart(POINTS);
    const table = byTestId(host, 'audience-chart-table');

    expect({
      headers: [...(table?.querySelectorAll('thead th') ?? [])].map((th) => ({
        text: normalized(th),
        scope: th.getAttribute('scope'),
      })),
      rows: [...host.querySelectorAll('[data-testid="audience-chart-row"]')].map((row) =>
        [...row.children].map((cell) => ({
          tag: cell.tagName,
          scope: cell.getAttribute('scope'),
          text: normalized(cell),
        })),
      ),
    }).toEqual({
      headers: [
        { text: 'Jour', scope: 'col' },
        { text: 'Visites', scope: 'col' },
        { text: 'Pages vues', scope: 'col' },
      ],
      rows: [
        [
          { tag: 'TH', scope: 'row', text: '7 sept.' },
          { tag: 'TD', scope: null, text: '6' },
          { tag: 'TD', scope: null, text: '9' },
        ],
        [
          { tag: 'TH', scope: 'row', text: '8 sept.' },
          { tag: 'TD', scope: null, text: '2' },
          { tag: 'TD', scope: null, text: '1\u202f500' },
        ],
      ],
    });
  });

  it('Given no visit When the chart renders Then the table has no row', async () => {
    const host = await renderChart([]);

    expect({
      rows: host.querySelectorAll('[data-testid="audience-chart-row"]').length,
    }).toEqual({ rows: 0 });
  });
});
