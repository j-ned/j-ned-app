import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AnalyticsEntityList } from './analytics-entity-list';
import type { EntityStat } from '@features/analytics/domain';

function setup(inputs: Record<string, unknown>) {
  TestBed.configureTestingModule({ schemas: [NO_ERRORS_SCHEMA] });
  const fixture = TestBed.createComponent(AnalyticsEntityList);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

const base = { title: 'Projets cliqués', icon: 'desktop', tagValue: '12 clics', entities: [] };

describe('AnalyticsEntityList', () => {
  it('affiche le titre', () => {
    const { el } = setup(base);
    expect(el.querySelector('h2')?.textContent).toContain('Projets cliqués');
  });

  it('en chargement, rend 5 skeletons et aucune ligne', () => {
    const { el } = setup({ ...base, loading: true });
    expect(el.querySelectorAll('app-skeleton').length).toBe(5);
    expect(el.querySelectorAll('[data-testid="entity-row"]').length).toBe(0);
  });

  it('vide, affiche emptyLabel', () => {
    const { el } = setup({ ...base, entities: [], emptyLabel: 'Aucun clic enregistré' });
    expect(el.querySelector('[data-testid="empty"]')?.textContent).toContain(
      'Aucun clic enregistré',
    );
  });

  it('rend une ligne par entité avec titre et count', () => {
    const entities: EntityStat[] = [
      { entityId: 'a', entityTitle: 'Projet A', count: 7 },
      { entityId: 'b', entityTitle: 'Projet B', count: 2 },
    ];
    const { el } = setup({ ...base, entities });
    const rows = el.querySelectorAll('[data-testid="entity-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Projet A');
    expect(rows[0].textContent).toContain('7');
    expect(rows[1].textContent).toContain('Projet B');
    expect(rows[1].textContent).toContain('2');
  });
});
