import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ChartData } from 'chart.js';
import { AppChart } from '@shared/ui/chart';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import type { ReadoutItem } from './admin-readout';
import { OverviewAudience } from './overview-audience';

const READOUT: readonly ReadoutItem[] = [
  { label: 'Pages vues', value: '56', unit: '', detail: '1,3 page par session' },
  { label: 'Rebond', value: '88,1', unit: '\u00a0%', detail: '37 sessions sur 42' },
  { label: 'Durée moyenne', value: '22', unit: '\u00a0s', detail: 'par page' },
];

const CHART_DATA: ChartData<'line'> = {
  labels: ['7 sept.', '8 sept.'],
  datasets: [{ label: 'Visiteurs', data: [6, 2] }],
};

const SUMMARY =
  'Visiteurs par jour du 7 septembre au 8 septembre 2026\u00a0: maximum 6 le 7 septembre.';

type ChartHost = HTMLElement & { readonly type?: unknown; readonly data?: unknown };

async function renderAudience(visits: number): Promise<{ host: HTMLElement }> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideComponent(OverviewAudience, {
    remove: { imports: [AppChart] },
    add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(OverviewAudience);
  fixture.componentRef.setInput('visits', visits);
  fixture.componentRef.setInput('readout', READOUT);
  fixture.componentRef.setInput('chartData', CHART_DATA);
  fixture.componentRef.setInput('chartOptions', { responsive: true });
  fixture.componentRef.setInput('chartSummary', SUMMARY);
  await settle(fixture);
  return { host: fixture.nativeElement as HTMLElement };
}

describe('OverviewAudience', () => {
  it('Given the 30-day audience When the section renders Then it is named « Audience » and shows the visits and the readout', async () => {
    const { host } = await renderAudience(42);
    const section = host.querySelector('section');
    const labelledBy = section?.getAttribute('aria-labelledby') ?? '';

    expect({
      name: host.querySelector(`[id="${labelledBy}"]`)?.textContent?.trim() ?? null,
      headingLevel: host.querySelector(`[id="${labelledBy}"]`)?.tagName ?? null,
      visitors: testIdText(host, 'overview-visits'),
      readout: host.querySelectorAll('[data-testid="readout-item"]').length,
    }).toEqual({
      name: 'Audience',
      headingLevel: 'H2',
      visitors: '42',
      readout: 3,
    });
  });

  it('Given the 30-day visits When the section renders Then the block reads exactly « Visites · 30 j » and the number, nothing else', async () => {
    const { host } = await renderAudience(42);

    expect(
      (byTestId(host, 'overview-visits-block')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    ).toBe('Visites · 30 j 42');
  });

  it('Given a chart summary When the section renders Then the curve sits in a figure whose caption is the text alternative', async () => {
    const { host } = await renderAudience(42);
    const figure = host.querySelector('figure');
    const chart = figure?.querySelector<ChartHost>('app-chart') ?? null;

    expect({
      caption: figure?.querySelector('figcaption')?.textContent?.trim() ?? null,
      chartType: chart?.type ?? chart?.getAttribute('type') ?? null,
      chartData: chart?.data === CHART_DATA,
    }).toEqual({ caption: SUMMARY, chartType: 'line', chartData: true });
  });

  it('Given the section When rendered Then its link leads to the detailed audience page', async () => {
    const { host } = await renderAudience(42);
    const link = byTestId(host, 'overview-audience-link');

    expect({ tag: link?.tagName ?? null, href: link?.getAttribute('href') ?? null }).toEqual({
      tag: 'A',
      href: '/admin/audience',
    });
  });

  it.each([
    { visits: 1, expected: '1' },
    { visits: 0, expected: '0' },
    { visits: 1234, expected: '1\u202f234' },
  ])(
    'Given $visits visits When rendered Then they read $expected',
    async ({ visits, expected }) => {
      const { host } = await renderAudience(visits);

      expect(testIdText(host, 'overview-visits')).toBe(expected);
    },
  );
});
