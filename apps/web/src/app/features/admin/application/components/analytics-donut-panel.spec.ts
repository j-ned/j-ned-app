import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js/auto';
import { AnalyticsDonutPanel } from './analytics-donut-panel';

const DATA: ChartData = { labels: ['Chrome'], datasets: [{ data: [3] }] };
const OPTIONS: ChartOptions = { responsive: true };

function setup(inputs: Record<string, unknown>): { fixture: ComponentFixture<AnalyticsDonutPanel>; el: HTMLElement } {
  TestBed.configureTestingModule({ schemas: [NO_ERRORS_SCHEMA] });
  const fixture = TestBed.createComponent(AnalyticsDonutPanel);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

const base = { title: 'Navigateurs', icon: 'globe', data: DATA, options: OPTIONS };

describe('AnalyticsDonutPanel', () => {
  it('affiche le titre', () => {
    const { el } = setup(base);
    expect(el.querySelector('h2')?.textContent).toContain('Navigateurs');
  });

  it('en chargement, rend un skeleton et pas de chart', () => {
    const { el } = setup({ ...base, loading: true });
    expect(el.querySelectorAll('app-skeleton').length).toBe(1);
    expect(el.querySelector('app-chart')).toBeNull();
  });

  it('vide, affiche le message et pas de chart', () => {
    const { el } = setup({ ...base, isEmpty: true });
    expect(el.querySelector('[data-testid="empty"]')?.textContent).toContain('Aucune donnée');
    expect(el.querySelector('app-chart')).toBeNull();
  });

  it('avec données, rend le chart', () => {
    const { el } = setup(base);
    expect(el.querySelector('app-chart')).not.toBeNull();
    expect(el.querySelector('[data-testid="empty"]')).toBeNull();
  });
});
