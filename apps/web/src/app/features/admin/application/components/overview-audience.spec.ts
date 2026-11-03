import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ChartData } from 'chart.js';
import { AppChart } from '@shared/ui/chart';
import { testIdText } from '@shared/testing/by-test-id';
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
  it.each([{ visits: 1234, expected: '1\u202f234' }])(
    'Given $visits visits When rendered Then they read $expected',
    async ({ visits, expected }) => {
      const { host } = await renderAudience(visits);

      expect(testIdText(host, 'overview-visits')).toBe(expected);
    },
  );
});
