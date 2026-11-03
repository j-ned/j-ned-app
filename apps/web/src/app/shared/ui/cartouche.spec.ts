import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Cartouche, type CartoucheRow } from './cartouche';

const rowsOf = (count: number): readonly CartoucheRow[] =>
  Array.from({ length: count }, (_, index) => ({
    label: `Libellé ${index + 1}`,
    value: `Valeur ${index + 1}`,
  }));

@Component({
  imports: [Cartouche],
  template: `
    <app-cartouche [title]="title()" [reference]="reference()" [rows]="rows()">
      <p data-testid="projected">Corps projeté</p>
    </app-cartouche>
  `,
})
class Host {
  readonly title = signal('Cadre de travail');
  readonly reference = signal('');
  readonly rows = signal<readonly CartoucheRow[]>([]);
}

describe('Cartouche', () => {
  const render = async (state: {
    title?: string;
    reference?: string;
    rows?: readonly CartoucheRow[];
  }): Promise<{ fixture: ComponentFixture<Host>; cartouche: HTMLElement }> => {
    const fixture = TestBed.createComponent(Host);
    if (state.title !== undefined) fixture.componentInstance.title.set(state.title);
    if (state.reference !== undefined) fixture.componentInstance.reference.set(state.reference);
    if (state.rows !== undefined) fixture.componentInstance.rows.set(state.rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const cartouche = root.querySelector('app-cartouche') as HTMLElement;
    return { fixture, cartouche };
  };

  const byTestId = (root: HTMLElement, id: string): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('Given un titre et une référence When le cartouche est rendu Then il affiche les deux et forme un groupe nommé par le titre', async () => {
    const { cartouche } = await render({ title: 'Cadre de travail', reference: 'RÉF. 009' });

    expect(byTestId(cartouche, 'cartouche-title').map((el) => el.textContent?.trim())).toEqual([
      'Cadre de travail',
    ]);
    expect(byTestId(cartouche, 'cartouche-reference').map((el) => el.textContent?.trim())).toEqual([
      'RÉF. 009',
    ]);
    expect(cartouche.getAttribute('role')).toBe('group');
    expect(cartouche.getAttribute('aria-label')).toBe('Cadre de travail');
  });

  it('Given un titre When le cartouche est rendu Then le titre est un paragraphe et aucun titre de section n’est émis', async () => {
    const { cartouche } = await render({ title: 'Cadre de travail' });

    expect(byTestId(cartouche, 'cartouche-title')[0]?.tagName).toBe('P');
    expect(cartouche.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });

  it('Given la référence par défaut When le cartouche est rendu Then aucune référence n’est rendue', () => {
    const fixture = TestBed.createComponent(Cartouche);
    fixture.componentRef.setInput('title', 'Cadre de travail');
    fixture.detectChanges();

    const cartouche = fixture.nativeElement as HTMLElement;
    expect(byTestId(cartouche, 'cartouche-reference')).toHaveLength(0);
    expect(byTestId(cartouche, 'cartouche-title')[0]?.textContent?.trim()).toBe('Cadre de travail');
  });

  it('Given un cartouche rendu When le titre change Then le texte et le nom du groupe suivent', async () => {
    const { fixture, cartouche } = await render({ title: 'Cadre de travail' });

    fixture.componentInstance.title.set('Délais');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(byTestId(cartouche, 'cartouche-title')[0]?.textContent?.trim()).toBe('Délais');
    expect(cartouche.getAttribute('aria-label')).toBe('Délais');
  });

  it.each([1, 3])(
    'Given %i ligne(s) When le cartouche est rendu Then chaque ligne est un dt + dd enfant direct de l’unique dl, dans l’ordre',
    async (count) => {
      const rows = rowsOf(count);
      const { cartouche } = await render({ rows });

      const lists = cartouche.querySelectorAll('dl');
      expect(lists).toHaveLength(1);
      const renderedRows = byTestId(cartouche, 'cartouche-row');
      expect(renderedRows).toHaveLength(count);
      expect(Array.from(lists[0].children)).toEqual(renderedRows);
      renderedRows.forEach((row, index) => {
        expect(Array.from(row.children).map((child) => child.tagName)).toEqual(['DT', 'DD']);
        expect(row.children[0].getAttribute('data-testid')).toBe('cartouche-label');
        expect(row.children[1].getAttribute('data-testid')).toBe('cartouche-value');
        expect(row.children[0].textContent?.trim()).toBe(rows[index].label);
        expect(row.children[1].textContent?.trim()).toBe(rows[index].value);
      });
    },
  );

  it('Given 0 ligne When le cartouche est rendu Then aucun dl ni ligne n’est émis', async () => {
    const { cartouche } = await render({ title: 'Cadre de travail', rows: [] });

    expect(byTestId(cartouche, 'cartouche-title')[0]?.textContent?.trim()).toBe('Cadre de travail');
    expect(cartouche.querySelectorAll('dl')).toHaveLength(0);
    expect(byTestId(cartouche, 'cartouche-row')).toHaveLength(0);
    expect(byTestId(cartouche, 'cartouche-label')).toHaveLength(0);
    expect(byTestId(cartouche, 'cartouche-value')).toHaveLength(0);
  });

  it('Given des lignes et du contenu projeté When le cartouche est rendu Then le contenu apparaît dans le cartouche, après le dl', async () => {
    const { cartouche } = await render({ rows: rowsOf(2) });

    const projected = cartouche.querySelector('[data-testid="projected"]');
    const list = cartouche.querySelector('dl');
    expect(projected?.textContent?.trim()).toBe('Corps projeté');
    expect(list).not.toBeNull();
    expect(list!.compareDocumentPosition(projected!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(list!.contains(projected)).toBe(false);
  });

  it('Given 0 ligne et du contenu projeté When le cartouche est rendu Then le contenu reste rendu dans le cartouche', async () => {
    const { cartouche } = await render({ rows: [] });

    expect(cartouche.querySelector('[data-testid="projected"]')?.textContent?.trim()).toBe(
      'Corps projeté',
    );
  });
});
