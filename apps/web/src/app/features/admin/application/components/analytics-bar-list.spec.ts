import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AnalyticsBarList } from './analytics-bar-list';
import type { MetricEntry } from '@features/analytics/domain/models/analytics.types';

function setup(inputs: Record<string, unknown>): { fixture: ComponentFixture<AnalyticsBarList>; el: HTMLElement } {
  TestBed.configureTestingModule({ schemas: [NO_ERRORS_SCHEMA] });
  const fixture = TestBed.createComponent(AnalyticsBarList);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

const base = { title: 'Pages les plus visitées', icon: 'file', rows: [], max: 1 };

describe('AnalyticsBarList', () => {
  it('affiche le titre', () => {
    const { el } = setup(base);
    expect(el.querySelector('h2')?.textContent).toContain('Pages les plus visitées');
  });

  it('en chargement, rend 5 skeletons et aucune ligne', () => {
    const { el } = setup({ ...base, loading: true });
    expect(el.querySelectorAll('app-skeleton').length).toBe(5);
    expect(el.querySelectorAll('[data-testid="bar-row"]').length).toBe(0);
  });

  it('vide, affiche le label par défaut', () => {
    const { el } = setup({ ...base, rows: [] });
    const empty = el.querySelector('[data-testid="empty"]');
    expect(empty?.textContent).toContain('Aucune donnée');
  });

  it('vide, affiche un emptyLabel personnalisé', () => {
    const { el } = setup({ ...base, rows: [], emptyLabel: 'Rien à voir' });
    expect(el.querySelector('[data-testid="empty"]')?.textContent).toContain('Rien à voir');
  });

  it('rend une ligne par item avec label et count', () => {
    const rows: MetricEntry[] = [
      { name: '/home', count: 10 },
      { name: '/about', count: 4 },
    ];
    const { el } = setup({ ...base, rows, max: 10 });
    const lines = el.querySelectorAll('[data-testid="bar-row"]');
    expect(lines.length).toBe(2);
    expect(lines[0].textContent).toContain('/home');
    expect(lines[0].textContent).toContain('10');
    expect(lines[1].textContent).toContain('/about');
    expect(lines[1].textContent).toContain('4');
  });

  it('applique le fallbackLabel quand name est vide', () => {
    const rows: MetricEntry[] = [{ name: '', count: 3 }];
    const { el } = setup({ ...base, rows, max: 3, fallbackLabel: '/' });
    expect(el.querySelector('[data-testid="bar-row"] span')?.textContent).toContain('/');
  });

  it('la barre interne reflète barWidth(count, max)', () => {
    const rows: MetricEntry[] = [{ name: '/x', count: 5 }];
    const { el } = setup({ ...base, rows, max: 10 });
    const bar = el.querySelector('[data-testid="bar-row"] .h-full') as HTMLElement;
    expect(bar.style.width).toBe('50%');
  });
});
