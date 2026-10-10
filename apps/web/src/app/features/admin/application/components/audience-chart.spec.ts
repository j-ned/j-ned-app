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

type ChartHost = HTMLElement & { readonly type?: unknown; readonly data?: unknown };

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
  it('Given two days of visits When the chart renders Then the curve sits in a figure whose hidden caption summarises it', async () => {
    const host = await renderChart(POINTS);
    const figure = host.querySelector('figure');
    const caption = figure?.querySelector('figcaption') ?? null;
    const chart = figure?.querySelector<ChartHost>('app-chart') ?? null;

    expect({
      caption: normalized(caption),
      hidden: caption?.classList.contains('sr-only') ?? false,
      chartType: chart?.type ?? chart?.getAttribute('type') ?? null,
      chartData: chart?.data === CHART_DATA,
    }).toEqual({
      caption:
        'Visites par jour du 7 septembre au 8 septembre 2026\u00a0: maximum 6 le 7 septembre.',
      hidden: true,
      chartType: 'line',
      chartData: true,
    });
  });

  it('Given the chart When it renders Then its data table sits in a closed disclosure named « Voir les données en tableau »', async () => {
    const host = await renderChart(POINTS);
    const disclosure = byTestId(host, 'audience-chart-data');

    expect({
      tag: disclosure?.tagName,
      open: disclosure instanceof HTMLDetailsElement ? disclosure.open : null,
      summary: normalized(disclosure?.querySelector('summary')),
      tableInside: disclosure?.contains(byTestId(host, 'audience-chart-table')) ?? false,
    }).toEqual({
      tag: 'DETAILS',
      open: false,
      summary: 'Voir les données en tableau',
      tableInside: true,
    });
  });

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

  it('Given no visit When the chart renders Then the caption says so and the table has no row', async () => {
    const host = await renderChart([]);

    expect({
      caption: normalized(host.querySelector('figcaption')),
      rows: host.querySelectorAll('[data-testid="audience-chart-row"]').length,
      disclosure: byTestId(host, 'audience-chart-data')?.tagName ?? null,
    }).toEqual({ caption: 'Aucune visite sur la période.', rows: 0, disclosure: 'DETAILS' });
  });
});
