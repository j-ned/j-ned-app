import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { byTestId } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { AdminOrderedList, type OrderedListConfig } from './admin-ordered-list';

type Line = { text: string };

const CONFIG: OrderedListConfig<Line> = {
  testIdPrefix: 'line',
  item: 'la ligne',
  moved: 'Ligne déplacée',
  added: 'Ligne ajoutée',
  removed: 'Ligne supprimée',
  add: 'Ajouter une ligne',
  max: 4,
  create: () => ({ text: '' }),
  trackKey: (line) => line.text,
};

@Component({
  imports: [AdminOrderedList, FormField],
  template: `
    <app-admin-ordered-list [rows]="fields.lines" [config]="config">
      <ng-template let-row let-rank="rank">
        <label [for]="'line-' + rank">Ligne {{ rank }}</label>
        <input [id]="'line-' + rank" data-testid="line-text" [formField]="row.text" />
      </ng-template>
    </app-admin-ordered-list>
  `,
})
class OrderedListHost {
  readonly model = signal<{ lines: Line[] }>({ lines: [] });
  readonly config = CONFIG;
  readonly fields = form(this.model);
}

type Rendered = {
  readonly fixture: ComponentFixture<OrderedListHost>;
  readonly host: HTMLElement;
  readonly texts: () => readonly string[];
};

async function renderList(texts: readonly string[]): Promise<Rendered> {
  const fixture = TestBed.createComponent(OrderedListHost);
  fixture.componentInstance.model.set({ lines: texts.map((text) => ({ text })) });
  await settle(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    texts: () => fixture.componentInstance.model().lines.map((line) => line.text),
  };
}

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const nativeButton = (element: Element | null | undefined): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const buttonNames = (row: HTMLElement): readonly string[] =>
  [...row.querySelectorAll('button')].map((button) => button.getAttribute('aria-label') ?? '');

const focusedName = (host: HTMLElement): string | null => {
  const active = document.activeElement;
  if (active && active === nativeButton(byTestId(host, 'line-add'))) return 'line-add';
  return active?.getAttribute('aria-label') ?? null;
};

const announcement = (host: HTMLElement): string =>
  (byTestId(host, 'line-announcer')?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

async function press(rendered: Rendered, testId: string, row: number): Promise<void> {
  const element = byTestId(all(rendered.host, 'line-row')[row] ?? rendered.host, testId);
  nativeButton(element)?.click();
  await settleBounded(rendered.fixture);
}

async function add(rendered: Rendered): Promise<void> {
  nativeButton(byTestId(rendered.host, 'line-add'))?.click();
  await settleBounded(rendered.fixture);
}

describe('AdminOrderedList: rendu', () => {
  it('Given three lines When the list renders Then they are the items of an ordered list, each drawn by the row template with its rank', async () => {
    const { host } = await renderList(['a', 'b', 'c']);
    const rows = all(host, 'line-row');

    expect({
      tags: rows.map((row) => `${row.parentElement?.tagName}>${row.tagName}`),
      labels: rows.map((row) => (row.querySelector('label')?.textContent ?? '').trim()),
      values: all(host, 'line-text').map((input) => (input as HTMLInputElement).value),
    }).toEqual({
      tags: ['OL>LI', 'OL>LI', 'OL>LI'],
      labels: ['Ligne 1', 'Ligne 2', 'Ligne 3'],
      values: ['a', 'b', 'c'],
    });
  });

  it('Given three lines When the list renders Then the first cannot move up, the last cannot move down, and each action names its line', async () => {
    const { host } = await renderList(['a', 'b', 'c']);

    expect(all(host, 'line-row').map(buttonNames)).toEqual([
      ['Descendre la ligne 1', 'Supprimer la ligne 1'],
      ['Monter la ligne 2', 'Descendre la ligne 2', 'Supprimer la ligne 2'],
      ['Monter la ligne 3', 'Supprimer la ligne 3'],
    ]);
  });

  it('Given the list When it renders Then every action is a plain button, the add button is named and a polite status region stands empty', async () => {
    const { host } = await renderList(['a', 'b']);
    const buttons = [...host.querySelectorAll('button')];
    const addButton = nativeButton(byTestId(host, 'line-add'));

    expect({
      types: [...new Set(buttons.map((button) => button.type))],
      add: addButton?.textContent?.replace(/[ \t\n\r]+/g, ' ').trim(),
      unavailable: addButton?.getAttribute('aria-disabled') === 'true',
      announcer: byTestId(host, 'line-announcer')?.getAttribute('role'),
      announcement: announcement(host),
    }).toEqual({
      types: ['button'],
      add: 'Ajouter une ligne',
      unavailable: false,
      announcer: 'status',
      announcement: '',
    });
  });
});

describe('AdminOrderedList: déplacer', () => {
  it.each([
    {
      move: 'the second up',
      testId: 'line-up',
      row: 1,
      order: ['b', 'a', 'c'],
      focused: 'Descendre la ligne 1',
      announced: 'Ligne déplacée en position 1',
    },
    {
      move: 'the third up',
      testId: 'line-up',
      row: 2,
      order: ['a', 'c', 'b'],
      focused: 'Monter la ligne 2',
      announced: 'Ligne déplacée en position 2',
    },
    {
      move: 'the first down',
      testId: 'line-down',
      row: 0,
      order: ['b', 'a', 'c'],
      focused: 'Descendre la ligne 2',
      announced: 'Ligne déplacée en position 2',
    },
    {
      move: 'the second down',
      testId: 'line-down',
      row: 1,
      order: ['a', 'c', 'b'],
      focused: 'Monter la ligne 3',
      announced: 'Ligne déplacée en position 3',
    },
  ])(
    'Given a, b, c When $move is moved Then the model follows, the focus stays on the moved line and the move is announced',
    async ({ testId, row, order, focused, announced }) => {
      const rendered = await renderList(['a', 'b', 'c']);

      await press(rendered, testId, row);

      expect({
        model: rendered.texts(),
        fields: all(rendered.host, 'line-text').map((input) => (input as HTMLInputElement).value),
        focused: focusedName(rendered.host),
        announced: announcement(rendered.host),
      }).toEqual({ model: order, fields: order, focused, announced });
    },
  );
});

describe('AdminOrderedList: ajouter', () => {
  it('Given two lines When a line is added Then a blank line from the factory ends the list, its first field is focused and the addition is announced', async () => {
    const rendered = await renderList(['a', 'b']);

    await add(rendered);
    const fields = all(rendered.host, 'line-text');

    expect({
      model: rendered.texts(),
      focusedIsNew: document.activeElement === fields[2],
      announced: announcement(rendered.host),
    }).toEqual({
      model: ['a', 'b', ''],
      focusedIsNew: true,
      announced: 'Ligne ajoutée en position 3',
    });
  });

  it('Given the maximum of lines When the add button is pressed Then it stays focusable but announced as unavailable, and nothing is added', async () => {
    const rendered = await renderList(['a', 'b', 'c', 'd']);
    const addButton = nativeButton(byTestId(rendered.host, 'line-add'));

    await add(rendered);

    expect({
      ariaDisabled: addButton?.getAttribute('aria-disabled'),
      disabled: addButton?.disabled,
      model: rendered.texts(),
    }).toEqual({ ariaDisabled: 'true', disabled: false, model: ['a', 'b', 'c', 'd'] });
  });

  it('Given one line under the maximum When a line is added Then it is added and the add button becomes unavailable', async () => {
    const rendered = await renderList(['a', 'b', 'c']);

    await add(rendered);

    expect({
      ariaDisabled: nativeButton(byTestId(rendered.host, 'line-add'))?.getAttribute(
        'aria-disabled',
      ),
      model: rendered.texts().length,
    }).toEqual({ ariaDisabled: 'true', model: 4 });
  });
});

describe('AdminOrderedList: supprimer', () => {
  it.each([
    {
      remove: 'the second of three',
      lines: ['a', 'b', 'c'],
      row: 1,
      model: ['a', 'c'],
      focused: 'Supprimer la ligne 2',
    },
    {
      remove: 'the last of three',
      lines: ['a', 'b', 'c'],
      row: 2,
      model: ['a', 'b'],
      focused: 'line-add',
    },
    {
      remove: 'the only one',
      lines: ['a'],
      row: 0,
      model: [],
      focused: 'line-add',
    },
  ])(
    'Given lines When $remove is removed Then the model follows, the focus moves to the next line or the add button, and the removal is announced',
    async ({ lines, row, model, focused }) => {
      const rendered = await renderList(lines);

      await press(rendered, 'line-remove', row);

      expect({
        model: rendered.texts(),
        focused: focusedName(rendered.host),
        announced: announcement(rendered.host),
      }).toEqual({ model, focused, announced: 'Ligne supprimée' });
    },
  );
});
