import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { MarkdownEditor } from './markdown-editor';

@Component({
  imports: [MarkdownEditor],
  template: `
    <button type="button" data-testid="elsewhere">Ailleurs</button>
    <textarea data-testid="markdown" appMarkdownEditor></textarea>
  `,
})
class EditorHost {}

type Rendered = {
  readonly fixture: ComponentFixture<EditorHost>;
  readonly textarea: HTMLTextAreaElement;
  readonly editor: MarkdownEditor;
  readonly inputs: Event[];
};

async function renderEditor(text: string, start: number, end: number): Promise<Rendered> {
  const fixture = TestBed.createComponent(EditorHost);
  await settle(fixture);
  const host = fixture.nativeElement as HTMLElement;
  const textarea = byTestId(host, 'markdown') as HTMLTextAreaElement;
  const editor = fixture.debugElement
    .query(By.directive(MarkdownEditor))
    .injector.get(MarkdownEditor);
  textarea.value = text;
  textarea.setSelectionRange(start, end);
  const inputs: Event[] = [];
  textarea.addEventListener('input', (event) => inputs.push(event));
  return { fixture, textarea, editor, inputs };
}

const keydown = (target: HTMLElement, init: KeyboardEventInit): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

type ZoneState = {
  readonly value: string;
  readonly selection: readonly number[];
  readonly inputs: number;
};

const state = ({ textarea, inputs }: Rendered): ZoneState => ({
  value: textarea.value,
  selection: [textarea.selectionStart, textarea.selectionEnd],
  inputs: inputs.length,
});

describe('MarkdownEditor: écrire une action dans la zone', () => {
  it('Given a word selected and no execCommand in the page When bold is applied Then the text is written by the fallback, the inner word stays selected and one input event is sent', async () => {
    const rendered = await renderEditor('un mot ici', 3, 6);

    rendered.editor.apply({ kind: 'inline', format: 'bold' });
    await settle(rendered.fixture);

    expect({
      execCommand: 'execCommand' in document,
      ...state(rendered),
      bubbles: rendered.inputs.map((event) => event.bubbles),
    }).toEqual({
      execCommand: false,
      value: 'un **mot** ici',
      selection: [5, 8],
      inputs: 1,
      bubbles: [true],
    });
  });

  it('Given the focus elsewhere in the page When an action is applied Then the focus is back in the zone', async () => {
    const rendered = await renderEditor('un mot ici', 3, 6);
    byTestId(rendered.fixture.nativeElement as HTMLElement, 'elsewhere')?.focus();

    rendered.editor.apply({ kind: 'inline', format: 'italic' });
    await settle(rendered.fixture);

    expect({ focused: document.activeElement === rendered.textarea, ...state(rendered) }).toEqual({
      focused: true,
      value: 'un *mot* ici',
      selection: [4, 7],
      inputs: 1,
    });
  });

  it('Given a bold word selected inside its markers When bold is applied again Then the markers are removed', async () => {
    const rendered = await renderEditor('un **mot** ici', 5, 8);

    rendered.editor.apply({ kind: 'inline', format: 'bold' });
    await settle(rendered.fixture);

    expect(state(rendered)).toEqual({ value: 'un mot ici', selection: [3, 6], inputs: 1 });
  });
});

describe('MarkdownEditor: raccourcis clavier', () => {
  it.each([
    { init: { key: 'b', ctrlKey: true }, value: 'un **mot** ici', selection: [5, 8] },
    { init: { key: 'b', metaKey: true }, value: 'un **mot** ici', selection: [5, 8] },
    { init: { key: 'i', ctrlKey: true }, value: 'un *mot* ici', selection: [4, 7] },
    { init: { key: 'u', ctrlKey: true }, value: 'un <u>mot</u> ici', selection: [6, 9] },
    { init: { key: 'e', metaKey: true }, value: 'un `mot` ici', selection: [4, 7] },
  ])(
    'Given a word selected When $init.key is pressed with a command key Then the zone is formatted and the browser action is cancelled',
    async ({ init, value, selection }) => {
      const rendered = await renderEditor('un mot ici', 3, 6);

      const event = keydown(rendered.textarea, init);
      await settle(rendered.fixture);

      expect({ prevented: event.defaultPrevented, ...state(rendered) }).toEqual({
        prevented: true,
        value,
        selection,
        inputs: 1,
      });
    },
  );

  it.each([
    { case: 'Ctrl + S', init: { key: 's', ctrlKey: true } },
    { case: 'Ctrl + Alt + B', init: { key: 'b', ctrlKey: true, altKey: true } },
    { case: 'Ctrl + Shift + B', init: { key: 'B', ctrlKey: true, shiftKey: true } },
    { case: 'B alone', init: { key: 'b' } },
  ])(
    'Given a word selected When $case is pressed Then the zone is untouched and the browser keeps the key',
    async ({ init }) => {
      const rendered = await renderEditor('un mot ici', 3, 6);

      const event = keydown(rendered.textarea, init);
      await settle(rendered.fixture);

      expect({ prevented: event.defaultPrevented, ...state(rendered) }).toEqual({
        prevented: false,
        value: 'un mot ici',
        selection: [3, 6],
        inputs: 0,
      });
    },
  );
});

describe('MarkdownEditor: lien au clavier', () => {
  it.each([{ ctrlKey: true }, { metaKey: true }])(
    'Given a word selected When K is pressed with %o Then a link is written around it, its address selected, and the browser action is cancelled',
    async (modifier) => {
      const rendered = await renderEditor('un mot ici', 3, 6);

      const event = keydown(rendered.textarea, { key: 'k', ...modifier });
      await settle(rendered.fixture);

      expect({ prevented: event.defaultPrevented, ...state(rendered) }).toEqual({
        prevented: true,
        value: 'un [mot](https://) ici',
        selection: [9, 17],
        inputs: 1,
      });
    },
  );
});

describe('MarkdownEditor: insertions de bloc', () => {
  it.each([
    {
      action: { kind: 'line-prefix', prefix: 'bullet-list' },
      value: '- un mot ici',
      selection: [5, 5],
    },
    { action: { kind: 'code-block' }, value: 'un mot ici\n\n```ts\n\n```', selection: [15, 17] },
    { action: { kind: 'rule' }, value: 'un mot ici\n\n---', selection: [15, 15] },
    {
      action: { kind: 'image', alt: 'Schéma', url: 'https://api.test/i.avif' },
      value: 'un mot ici\n\n![Schéma](https://api.test/i.avif)',
      selection: [46, 46],
    },
  ] as const)(
    'Given the caret When $action.kind is applied Then the zone receives it by one input event',
    async ({ action, value, selection }) => {
      const caret = action.kind === 'line-prefix' ? 3 : 10;
      const rendered = await renderEditor('un mot ici', caret, caret);

      rendered.editor.apply(action);
      await settle(rendered.fixture);

      expect(state(rendered)).toEqual({ value, selection, inputs: 1 });
    },
  );
});
