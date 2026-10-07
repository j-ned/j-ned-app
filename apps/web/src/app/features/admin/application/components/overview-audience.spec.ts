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

async function renderAudience(visitors: number, sessions: number): Promise<{ host: HTMLElement }> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideComponent(OverviewAudience, {
    remove: { imports: [AppChart] },
    add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(OverviewAudience);
  fixture.componentRef.setInput('visitors', visitors);
  fixture.componentRef.setInput('sessions', sessions);
  fixture.componentRef.setInput('readout', READOUT);
  fixture.componentRef.setInput('chartData', CHART_DATA);
  fixture.componentRef.setInput('chartOptions', { responsive: true });
  fixture.componentRef.setInput('chartSummary', SUMMARY);
  await settle(fixture);
  return { host: fixture.nativeElement as HTMLElement };
}

describe('OverviewAudience', () => {
  it('Given the 30-day audience When the section renders Then it is named « Audience » and shows the visitors, the sessions and the readout', async () => {
    const { host } = await renderAudience(42, 42);
    const section = host.querySelector('section');
    const labelledBy = section?.getAttribute('aria-labelledby') ?? '';

    expect({
      name: host.querySelector(`[id="${labelledBy}"]`)?.textContent?.trim() ?? null,
      headingLevel: host.querySelector(`[id="${labelledBy}"]`)?.tagName ?? null,
      visitors: testIdText(host, 'overview-visitors'),
      sessions: testIdText(host, 'overview-sessions'),
      readout: host.querySelectorAll('[data-testid="readout-item"]').length,
    }).toEqual({
      name: 'Audience',
      headingLevel: 'H2',
      visitors: '42',
      sessions: '42 sessions',
      readout: 3,
    });
  });

  it('Given a chart summary When the section renders Then the curve sits in a figure whose caption is the text alternative', async () => {
    const { host } = await renderAudience(42, 42);
    const figure = host.querySelector('figure');
    const chart = figure?.querySelector<ChartHost>('app-chart') ?? null;

    expect({
      caption: figure?.querySelector('figcaption')?.textContent?.trim() ?? null,
      chartType: chart?.type ?? chart?.getAttribute('type') ?? null,
      chartData: chart?.data === CHART_DATA,
    }).toEqual({ caption: SUMMARY, chartType: 'line', chartData: true });
  });

  it('Given the section When rendered Then its link leads to the detailed audience page', async () => {
    const { host } = await renderAudience(42, 42);
    const link = byTestId(host, 'overview-audience-link');

    expect({ tag: link?.tagName ?? null, href: link?.getAttribute('href') ?? null }).toEqual({
      tag: 'A',
      href: '/admin/audience',
    });
  });

  it.each([
    { visitors: 1, sessions: 1, expected: { visitors: '1', sessions: '1 session' } },
    { visitors: 0, sessions: 0, expected: { visitors: '0', sessions: '0 session' } },
    {
      visitors: 1234,
      sessions: 1500,
      expected: { visitors: '1\u202f234', sessions: '1\u202f500 sessions' },
    },
  ])(
    'Given $visitors visitors and $sessions sessions When rendered Then they read $expected.visitors and « $expected.sessions »',
    async ({ visitors, sessions, expected }) => {
      const { host } = await renderAudience(visitors, sessions);

      expect({
        visitors: testIdText(host, 'overview-visitors'),
        sessions: testIdText(host, 'overview-sessions'),
      }).toEqual(expected);
    },
  );
});
