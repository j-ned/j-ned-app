import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { applyEach, form, required } from '@angular/forms/signals';
import { byTestId } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle } from '@shared/testing/settle';
import { AdminPairRows, type PairRow, type PairRowsConfig } from './admin-pair-rows';

type Pair = PairRow<'a', 'b'>;

const CONFIG: PairRowsConfig<'a', 'b'> = {
  heading: 'Paires',
  idPrefix: 'p',
  testIdPrefix: 'pair',
  first: { key: 'a', label: 'A', slug: 'x', placeholder: 'Premier' },
  second: { key: 'b', label: 'B', slug: 'y', placeholder: 'Second' },
  removeLabel: 'Retirer la paire',
  addLabel: 'Ajouter une paire',
};

const TWO_ROWS: readonly Pair[] = [
  { a: 'a1', b: 'b1' },
  { a: 'a2', b: 'b2' },
];

@Component({
  imports: [AdminPairRows],
  template: `<app-admin-pair-rows [rows]="fields.rows" [config]="config" />`,
})
class PairRowsHost {
  readonly model = signal<{ rows: Pair[] }>({ rows: [] });
  readonly config = CONFIG;
  readonly fields = form(this.model, (path) => {
    applyEach(path.rows, (row) => {
      required(row.a, { message: 'Requis' });
      required(row.b, { message: 'Requis' });
    });
  });
}

type CellView = {
  readonly label: string | null;
  readonly id: string;
  readonly value: string;
  readonly placeholder: string | null;
};

type Rendered = {
  readonly fixture: ComponentFixture<PairRowsHost>;
  readonly host: HTMLElement;
};

async function renderRows(rows: readonly Pair[]): Promise<Rendered> {
  const fixture = TestBed.createComponent(PairRowsHost);
  fixture.componentInstance.model.set({ rows: rows.map((row) => ({ ...row })) });
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const labelOf = (host: HTMLElement, control: HTMLElement): string | null => {
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => control.id !== '' && label.getAttribute('for') === control.id,
  );
  return labels.length === 1 ? normalized(labels[0]) : null;
};

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const removeNames = (host: HTMLElement): readonly string[] =>
  all(host, 'pair-remove').map((element) => {
    const button = nativeButton(element);
    return button?.getAttribute('aria-label') ?? normalized(button);
  });

const modelRows = (rendered: Rendered): readonly Pair[] =>
  rendered.fixture.componentInstance.model().rows.map((row) => ({ a: row.a, b: row.b }));

const describedBy = (control: HTMLElement | null): string | null =>
  control?.getAttribute('aria-describedby') ?? null;

describe('AdminPairRows: rendu des rangées', () => {
  it('Given the rows When they render Then the section is titled by a level-2 heading', async () => {
    const { host } = await renderRows(TWO_ROWS);

    expect(
      [...host.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(
        (heading) => `${heading.tagName} ${normalized(heading)}`,
      ),
    ).toEqual(['H2 Paires']);
  });

  it('Given the rows When they render Then the column headings are hidden from assistive technologies', async () => {
    const { host } = await renderRows(TWO_ROWS);

    expect(
      [...host.querySelectorAll('[aria-hidden="true"]')]
        .filter((element) => normalized(element) !== '')
        .map((element) => [...element.children].map((child) => normalized(child))),
    ).toEqual([['N°', 'A', 'B']]);
  });

  it('Given two rows When they render Then each cell has its numbered label, its own id, its placeholder and each row its rank', async () => {
    const { host } = await renderRows(TWO_ROWS);
    const cells = (testId: string): readonly CellView[] =>
      all(host, testId).map((control) => ({
        label: labelOf(host, control),
        id: control.id,
        value: (control as HTMLInputElement).value,
        placeholder: control.getAttribute('placeholder'),
      }));

    expect({
      first: cells('pair-x'),
      second: cells('pair-y'),
      ranks: all(host, 'pair-rank').map((rank) => normalized(rank)),
    }).toEqual({
      first: [
        { label: 'A 1', id: 'p-1-x', value: 'a1', placeholder: 'Premier' },
        { label: 'A 2', id: 'p-2-x', value: 'a2', placeholder: 'Premier' },
      ],
      second: [
        { label: 'B 1', id: 'p-1-y', value: 'b1', placeholder: 'Second' },
        { label: 'B 2', id: 'p-2-y', value: 'b2', placeholder: 'Second' },
      ],
      ranks: ['01', '02'],
    });
  });

  it('Given two rows When they render Then each remove action names its row', async () => {
    const { host } = await renderRows(TWO_ROWS);

    expect(removeNames(host)).toEqual(['Retirer la paire 1', 'Retirer la paire 2']);
  });
});

describe('AdminPairRows: ajout et retrait', () => {
  it('Given two rows When a row is added Then the model holds an empty third row and a third cell shows', async () => {
    const rendered = await renderRows(TWO_ROWS);
    const add = byTestId(rendered.host, 'pair-add');

    await pressTestId(rendered.fixture, 'pair-add');

    expect({
      addLabel: normalized(add),
      rows: modelRows(rendered),
      cells: all(rendered.host, 'pair-x').map((control) => control.id),
    }).toEqual({
      addLabel: 'Ajouter une paire',
      rows: [...TWO_ROWS, { a: '', b: '' }],
      cells: ['p-1-x', 'p-2-x', 'p-3-x'],
    });
  });

  it('Given two rows When the first one is removed Then the model drops it and the remaining row becomes the first', async () => {
    const rendered = await renderRows(TWO_ROWS);

    await pressTestId(rendered.fixture, 'pair-remove', 0);

    expect({
      rows: modelRows(rendered),
      cells: all(rendered.host, 'pair-x').map((control) => ({
        label: labelOf(rendered.host, control),
        id: control.id,
        value: (control as HTMLInputElement).value,
      })),
      ranks: all(rendered.host, 'pair-rank').map((rank) => normalized(rank)),
      remove: removeNames(rendered.host),
    }).toEqual({
      rows: [{ a: 'a2', b: 'b2' }],
      cells: [{ label: 'A 1', id: 'p-1-x', value: 'a2' }],
      ranks: ['01'],
      remove: ['Retirer la paire 1'],
    });
  });
});

describe('AdminPairRows: erreur de cellule annoncée et reliée', () => {
  it.each([
    { cell: 'pair-x', errorId: 'p-1-x-error', other: 'pair-y' },
    { cell: 'pair-y', errorId: 'p-1-y-error', other: 'pair-x' },
  ])(
    'Given an empty row When $cell is left Then it is invalid and described by its own error, the other cell untouched',
    async ({ cell, errorId, other }) => {
      const rendered = await renderRows([{ a: '', b: '' }]);

      byTestId(rendered.host, cell)?.dispatchEvent(new Event('blur'));
      await settle(rendered.fixture);
      const error = rendered.host.querySelector(`[id="${errorId}"]`);

      expect({
        invalid: byTestId(rendered.host, cell)?.getAttribute('aria-invalid'),
        describedBy: describedBy(byTestId(rendered.host, cell)),
        error: {
          testId: error?.getAttribute('data-testid'),
          role: error?.getAttribute('role'),
          text: normalized(error),
        },
        other: {
          invalid: byTestId(rendered.host, other)?.getAttribute('aria-invalid'),
          describedBy: describedBy(byTestId(rendered.host, other)),
        },
      }).toEqual({
        invalid: 'true',
        describedBy: errorId,
        error: { testId: `${cell}-error`, role: 'alert', text: 'Requis' },
        other: { invalid: 'false', describedBy: null },
      });
    },
  );

  it('Given two rows with the second emptied and left When they render Then only the second row shows an error', async () => {
    const rendered = await renderRows([TWO_ROWS[0], { a: '', b: 'b2' }]);

    byTestId(rendered.host, 'pair-x', 1)?.dispatchEvent(new Event('blur'));
    await settle(rendered.fixture);

    expect(
      all(rendered.host, 'pair-x-error').map((error) => ({
        id: error.id,
        text: normalized(error),
      })),
    ).toEqual([{ id: 'p-2-x-error', text: 'Requis' }]);
  });
});
