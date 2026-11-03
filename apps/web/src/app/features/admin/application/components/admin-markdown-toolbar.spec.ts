import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { ContentImage } from '@features/blog/domain/models/content-image.model';
import { makeContentImage } from '@features/blog/testing/blog-post-builders';
import { stubBlogGateway } from '@features/blog/testing/stub-blog-gateway';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import {
  BODY_IMAGE_FILE,
  imagePanel,
  imagePanelAlt,
  insertBodyImage,
  openImagePanel,
  pickImageFile,
  pressImagePanel,
  pressKeyInImageAlt,
  typeImageAlt,
} from '../testing/content-image-panel-page';
import { AdminMarkdownToolbar } from './admin-markdown-toolbar';
import { MarkdownEditor } from './markdown-editor';

@Component({
  imports: [AdminMarkdownToolbar, MarkdownEditor],
  template: `
    <app-admin-markdown-toolbar [editor]="editor" />
    <textarea
      id="markdown-zone"
      data-testid="markdown"
      appMarkdownEditor
      #editor="markdownEditor"
    ></textarea>
  `,
})
class ToolbarHost {}

@Component({
  imports: [AdminMarkdownToolbar, MarkdownEditor],
  template: `
    <app-admin-markdown-toolbar [editor]="first" />
    <textarea id="first-zone" appMarkdownEditor #first="markdownEditor"></textarea>
    <app-admin-markdown-toolbar [editor]="second" />
    <textarea id="second-zone" appMarkdownEditor #second="markdownEditor"></textarea>
  `,
})
class TwoToolbarsHost {}

type Rendered = {
  readonly fixture: ComponentFixture<ToolbarHost>;
  readonly host: HTMLElement;
  readonly toolbar: HTMLElement;
  readonly textarea: HTMLTextAreaElement;
  readonly inputs: Event[];
};

let uploadContentImage: Mock<(file: File) => Observable<ContentImage>>;

beforeEach(() => {
  uploadContentImage = vi.fn(() => of(makeContentImage()));
  TestBed.configureTestingModule({
    providers: [{ provide: BlogGateway, useValue: stubBlogGateway({ uploadContentImage }) }],
  });
});

async function renderToolbar(text = '', start = 0, end = start): Promise<Rendered> {
  const fixture = TestBed.createComponent(ToolbarHost);
  await settle(fixture);
  const host = fixture.nativeElement as HTMLElement;
  const textarea = byTestId(host, 'markdown') as HTMLTextAreaElement;
  textarea.value = text;
  textarea.dispatchEvent(new Event('input'));
  textarea.setSelectionRange(start, end);
  textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
  await settle(fixture);
  const inputs: Event[] = [];
  textarea.addEventListener('input', (event) => inputs.push(event));
  const toolbar = byTestId(host, 'markdown-toolbar') ?? host;
  return { fixture, host, toolbar, textarea, inputs };
}

const items = (toolbar: HTMLElement): readonly HTMLElement[] => [
  ...toolbar.querySelectorAll<HTMLElement>('button, select'),
];

const tabbable = (toolbar: HTMLElement): readonly (string | null)[] =>
  items(toolbar).map((item) => item.getAttribute('tabindex'));

const onlyTabbable = (toolbar: HTMLElement, index: number): readonly string[] =>
  items(toolbar).map((_, position) => (position === index ? '0' : '-1'));

const keydown = (target: HTMLElement, key: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

const blockSelect = (host: HTMLElement): HTMLSelectElement | null => {
  const element = byTestId(host, 'markdown-block-level');
  return element instanceof HTMLSelectElement ? element : null;
};

async function click(rendered: Rendered, testId: string): Promise<void> {
  byTestId(rendered.toolbar, testId)?.click();
  await settle(rendered.fixture);
}

describe('AdminMarkdownToolbar: focus itinérant', () => {
  it('Given the toolbar When it renders Then only its first control is reachable with Tab', async () => {
    const { toolbar } = await renderToolbar();

    expect({ controls: items(toolbar).length >= 5, tabbable: tabbable(toolbar) }).toEqual({
      controls: true,
      tabbable: onlyTabbable(toolbar, 0),
    });
  });

  it.each([
    { from: 'first', key: 'ArrowRight', to: 'second' },
    { from: 'first', key: 'ArrowLeft', to: 'last' },
    { from: 'second', key: 'Home', to: 'first' },
  ] as const)(
    'Given the focus on the $from control When $key is pressed Then the $to control takes the focus and becomes the only tabbable one',
    async ({ from, key, to }) => {
      const { toolbar, fixture } = await renderToolbar();
      const count = items(toolbar).length;
      const index = { first: 0, second: 1, last: count - 1 };
      items(toolbar)[index[from]]?.focus();
      await settle(fixture);

      const event = keydown(items(toolbar)[index[from]] ?? toolbar, key);
      await settle(fixture);

      expect({
        enough: count >= 5,
        focused: items(toolbar).indexOf(document.activeElement as HTMLElement),
        tabbable: tabbable(toolbar),
        prevented: event.defaultPrevented,
      }).toEqual({
        enough: true,
        focused: index[to],
        tabbable: onlyTabbable(toolbar, index[to]),
        prevented: true,
      });
    },
  );

  it('Given a control focused by the pointer When the toolbar renders Then that control becomes the only tabbable one', async () => {
    const { toolbar, fixture } = await renderToolbar();

    items(toolbar)[2]?.focus();
    await settle(fixture);

    expect({ controls: items(toolbar).length >= 5, tabbable: tabbable(toolbar) }).toEqual({
      controls: true,
      tabbable: onlyTabbable(toolbar, 2),
    });
  });

  it.each(['ArrowUp', 'ArrowDown'])(
    'Given the focus on a button When %s is pressed Then the focus stays and the key is left to the browser',
    async (key) => {
      const { toolbar, fixture } = await renderToolbar();
      const bold = byTestId(toolbar, 'markdown-tool-bold') ?? toolbar;
      bold.focus();
      await settle(fixture);

      const event = keydown(bold, key);
      await settle(fixture);

      expect({
        found: bold !== toolbar,
        focused: document.activeElement === bold,
        prevented: event.defaultPrevented,
      }).toEqual({ found: true, focused: true, prevented: false });
    },
  );
});

describe('AdminMarkdownToolbar: mise en forme en ligne', () => {
  it.each([
    { testId: 'markdown-tool-bold', value: 'un **mot** ici', selection: [5, 8] },
    { testId: 'markdown-tool-inline-code', value: 'un `mot` ici', selection: [4, 7] },
  ])(
    'Given a word selected When $testId is clicked Then the zone is formatted, the word stays selected and the focus is back in the zone',
    async ({ testId, value, selection }) => {
      const rendered = await renderToolbar('un mot ici', 3, 6);

      await click(rendered, testId);

      expect({
        value: rendered.textarea.value,
        selection: [rendered.textarea.selectionStart, rendered.textarea.selectionEnd],
        focused: document.activeElement === rendered.textarea,
        inputs: rendered.inputs.length,
      }).toEqual({ value, selection, focused: true, inputs: 1 });
    },
  );
});

describe('AdminMarkdownToolbar: niveau de bloc', () => {
  it('Given the caret moved from a title to a paragraph When the caret settles Then the select follows the new line', async () => {
    const rendered = await renderToolbar('## Titre\n\nTexte', 3);

    rendered.textarea.setSelectionRange(12, 12);
    rendered.textarea.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }),
    );
    await settle(rendered.fixture);

    expect(blockSelect(rendered.host)?.value).toBe('paragraph');
  });

  it('Given the caret in a paragraph When « Titre 3 » is chosen Then the line becomes a level-3 title, the caret follows its text, the select reads « Titre 3 » and keeps the focus', async () => {
    const rendered = await renderToolbar('Texte\n\nSuite', 2);
    const select = blockSelect(rendered.host);
    select?.focus();

    if (select) select.value = 'h3';
    select?.dispatchEvent(new Event('change', { bubbles: true }));
    await settle(rendered.fixture);

    expect({
      value: rendered.textarea.value,
      caret: [rendered.textarea.selectionStart, rendered.textarea.selectionEnd],
      select: blockSelect(rendered.host)?.value,
      focused: document.activeElement === select,
      inputs: rendered.inputs.length,
    }).toEqual({
      value: '### Texte\n\nSuite',
      caret: [6, 6],
      select: 'h3',
      focused: true,
      inputs: 1,
    });
  });

  it.each([
    { key: 'ArrowRight', step: 1, prevented: true },
    { key: 'ArrowLeft', step: -1, prevented: true },
    { key: 'ArrowDown', step: 0, prevented: false },
    { key: 'ArrowUp', step: 0, prevented: false },
  ])(
    'Given the focus on the select When $key is pressed Then the focus moves by $step and the key is left to the select: $prevented',
    async ({ key, step, prevented }) => {
      const { toolbar, host, fixture } = await renderToolbar();
      const select = blockSelect(host);
      const count = items(toolbar).length;
      const from = select ? items(toolbar).indexOf(select) : -1;
      select?.focus();
      await settle(fixture);

      const event = keydown(select ?? toolbar, key);
      await settle(fixture);

      expect({
        found: from >= 0,
        focused: items(toolbar).indexOf(document.activeElement as HTMLElement),
        prevented: event.defaultPrevented,
      }).toEqual({ found: true, focused: (from + step + count) % count, prevented });
    },
  );
});

describe('AdminMarkdownToolbar: listes, citation, lien, bloc de code, séparateur', () => {
  it.each([
    {
      testId: 'markdown-tool-bullet-list',
      text: 'un mot ici',
      from: [3, 3],
      value: '- un mot ici',
      selection: [5, 5],
    },
    {
      testId: 'markdown-tool-quote',
      text: '> un mot',
      from: [4, 4],
      value: 'un mot',
      selection: [2, 2],
    },
  ])(
    'Given $text When $testId is clicked Then the zone reads $value, and the focus is back in the zone',
    async ({ testId, text, from, value, selection }) => {
      const rendered = await renderToolbar(text, from[0], from[1]);

      await click(rendered, testId);

      expect({
        value: rendered.textarea.value,
        selection: [rendered.textarea.selectionStart, rendered.textarea.selectionEnd],
        focused: document.activeElement === rendered.textarea,
        inputs: rendered.inputs.length,
      }).toEqual({ value, selection, focused: true, inputs: 1 });
    },
  );

  it.each([
    {
      testId: 'markdown-tool-bullet-list',
      applied: 'Liste à puces appliquée',
      removed: 'Liste à puces retirée',
    },
    {
      testId: 'markdown-tool-ordered-list',
      applied: 'Liste numérotée appliquée',
      removed: 'Liste numérotée retirée',
    },
    { testId: 'markdown-tool-quote', applied: 'Citation appliquée', removed: 'Citation retirée' },
  ])(
    'Given a line When $testId is clicked twice Then the status tells it was applied, then removed, and the line is back',
    async ({ testId, applied, removed }) => {
      const rendered = await renderToolbar('un mot ici', 3);

      await click(rendered, testId);
      const first = testIdText(rendered.host, 'markdown-toolbar-status');
      await click(rendered, testId);

      expect({
        first,
        second: testIdText(rendered.host, 'markdown-toolbar-status'),
        value: rendered.textarea.value,
      }).toEqual({ first: applied, second: removed, value: 'un mot ici' });
    },
  );
});

describe('AdminMarkdownToolbar: image', () => {
  const imageButton = (toolbar: HTMLElement): HTMLElement | null =>
    byTestId(toolbar, 'markdown-tool-image');

  it('Given the toolbar When « Image » is clicked Then the panel opens outside the toolbar, takes the focus, and the button says it controls it', async () => {
    const rendered = await renderToolbar('Avant', 5);
    const controlsBefore = items(rendered.toolbar).length;

    await openImagePanel(rendered.fixture);
    const panel = imagePanel(rendered.host);

    expect({
      expanded: imageButton(rendered.toolbar)?.getAttribute('aria-expanded'),
      controls:
        Boolean(panel?.id) &&
        imageButton(rendered.toolbar)?.getAttribute('aria-controls') === panel?.id,
      outsideToolbar: panel !== null && !rendered.toolbar.contains(panel),
      toolbarControls: items(rendered.toolbar).length,
      focusInPanel: panel?.contains(document.activeElement) ?? false,
      value: rendered.textarea.value,
    }).toEqual({
      expanded: 'true',
      controls: true,
      outsideToolbar: true,
      toolbarControls: controlsBefore,
      focusInPanel: true,
      value: 'Avant',
    });
  });

  it('Given the panel open When « Image » is clicked again Then the panel closes', async () => {
    const rendered = await renderToolbar();

    await openImagePanel(rendered.fixture);
    await openImagePanel(rendered.fixture);

    expect({
      expanded: imageButton(rendered.toolbar)?.getAttribute('aria-expanded'),
      panel: imagePanel(rendered.host),
    }).toEqual({ expanded: 'false', panel: null });
  });

  it('Given the caret after a paragraph When an image is sent with its alt text Then it is written at the caret by one input event, the panel closes, and the focus is back in the zone', async () => {
    const rendered = await renderToolbar('Avant\n\nAprès', 5);

    await insertBodyImage(rendered.fixture, 'Schéma du chiffrement');
    const markdown = `![Schéma du chiffrement](${makeContentImage().url})`;

    expect({
      calls: uploadContentImage.mock.calls,
      value: rendered.textarea.value,
      caret: [rendered.textarea.selectionStart, rendered.textarea.selectionEnd],
      inputs: rendered.inputs.length,
      panel: imagePanel(rendered.host),
      expanded: imageButton(rendered.toolbar)?.getAttribute('aria-expanded'),
      focused: document.activeElement === rendered.textarea,
    }).toEqual({
      calls: [[BODY_IMAGE_FILE]],
      value: `Avant\n\n${markdown}\n\nAprès`,
      caret: [7 + markdown.length, 7 + markdown.length],
      inputs: 1,
      panel: null,
      expanded: 'false',
      focused: true,
    });
  });

  it('Given a refused image When it is sent Then the panel stays open with its message and its alt text, and the zone is untouched', async () => {
    const rendered = await renderToolbar('Avant', 5);
    uploadContentImage.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 413, statusText: 'Too large' })),
    );

    await insertBodyImage(rendered.fixture, 'Schéma');

    expect({
      panel: imagePanel(rendered.host) !== null,
      errorShown: testIdText(rendered.host, 'markdown-image-error') !== '',
      alt: imagePanelAlt(rendered.host)?.value,
      value: rendered.textarea.value,
      inputs: rendered.inputs.length,
      status: testIdText(rendered.host, 'markdown-toolbar-status'),
    }).toEqual({
      panel: true,
      errorShown: true,
      alt: 'Schéma',
      value: 'Avant',
      inputs: 0,
      status: '',
    });
  });

  it.each(['cancel', 'escape'] as const)(
    'Given the panel open with a file and an alt text When it is closed by %s Then nothing is sent, the zone is untouched and the focus is back on « Image »',
    async (how) => {
      const rendered = await renderToolbar('Avant', 5);
      await openImagePanel(rendered.fixture);
      await pickImageFile(rendered.fixture);
      await typeImageAlt(rendered.fixture, 'Schéma');

      if (how === 'cancel') await pressImagePanel(rendered.fixture, 'markdown-image-cancel');
      else await pressKeyInImageAlt(rendered.fixture, 'Escape');

      expect({
        panel: imagePanel(rendered.host),
        expanded: imageButton(rendered.toolbar)?.getAttribute('aria-expanded'),
        focused: document.activeElement === imageButton(rendered.toolbar),
        uploads: uploadContentImage.mock.calls.length,
        value: rendered.textarea.value,
        inputs: rendered.inputs.length,
      }).toEqual({
        panel: null,
        expanded: 'false',
        focused: true,
        uploads: 0,
        value: 'Avant',
        inputs: 0,
      });
    },
  );
});

describe('AdminMarkdownToolbar: deux zones sur une page', () => {
  it('Given two Markdown zones on one page When both image panels are open Then every identifier is unique, each panel names itself and labels its own field from identifiers drawn from its own', async () => {
    const fixture = TestBed.createComponent(TwoToolbarsHost);
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;
    for (const button of host.querySelectorAll<HTMLElement>(
      '[data-testid="markdown-tool-image"]',
    )) {
      button.click();
      await settle(fixture);
    }
    const panels = [...host.querySelectorAll<HTMLElement>('[data-testid="markdown-image-panel"]')];
    const ids = [...host.querySelectorAll('[id]')].map((element) => element.id);

    expect({
      panels: panels.length,
      duplicates: ids.filter((id, index) => ids.indexOf(id) !== index),
      panelsSeen: panels.map((panel) => {
        const alt = imagePanelAlt(panel);
        const label = alt?.id ? host.querySelector(`label[for="${alt.id}"]`) : null;
        const inner = [...panel.querySelectorAll('[id]')].map((element) => element.id);
        return {
          name: accessibleName(panel, host),
          labelInPanel: label !== null && panel.contains(label),
          innerIds:
            panel.id !== '' && inner.length > 0 && inner.every((id) => id.startsWith(panel.id)),
        };
      }),
    }).toEqual({
      panels: 2,
      duplicates: [],
      panelsSeen: [
        { name: 'Insérer une image', labelInPanel: true, innerIds: true },
        { name: 'Insérer une image', labelInPanel: true, innerIds: true },
      ],
    });
  });
});
