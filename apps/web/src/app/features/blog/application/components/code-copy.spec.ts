import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { accessibleName } from '@shared/testing/accessible-name';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { BlogArticleBody } from './blog-article-body';
import { CodeCopy } from './code-copy';

const SECOND_BLOCK = 'echo "<b>x</b>" && ls\ncd /tmp';

@Component({
  imports: [CodeCopy, BlogArticleBody],
  template: `
    <div appCodeCopy #copy="appCodeCopy">
      <app-blog-article-body [markdown]="markdown" />
      <p data-testid="outside-code">Texte hors du code</p>
    </div>
    <p role="status" data-testid="code-copy-status">{{ copy.status() }}</p>
  `,
})
class CopyHost {
  protected readonly markdown = [
    'Intro',
    '```ts\nconst a = 1;\n```',
    '```bash\n' + SECOND_BLOCK + '\n```',
  ].join('\n\n');
}

const COPIED = 'Code copié dans le presse-papiers';
const FAILED = 'Copie impossible\u00a0: sélectionnez le code.';

type Rendered = {
  readonly fixture: ComponentFixture<CopyHost>;
  readonly host: HTMLElement;
  readonly buttons: () => readonly HTMLButtonElement[];
  readonly status: () => string;
};

async function renderHost(): Promise<Rendered> {
  const fixture = TestBed.createComponent(CopyHost);
  await settle(fixture);
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    buttons: () => [...host.querySelectorAll<HTMLButtonElement>('button[data-code-copy]')],
    status: () => testIdText(host, 'code-copy-status'),
  };
}

const label = (button: HTMLButtonElement | undefined): string =>
  (button?.textContent ?? '').replace(/\s+/g, ' ').trim();

const nameOf = (button: HTMLButtonElement | undefined, host: HTMLElement): string =>
  button ? accessibleName(button, host) : '';

async function flushWithFakeTimers(fixture: ComponentFixture<unknown>, ms = 0): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  fixture.detectChanges();
}

describe('CodeCopy', () => {
  beforeEach(async () => {
    await navigator.clipboard.writeText('avant');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('Given two code blocks When the second « Copier » is clicked Then its exact code reaches the clipboard, the button says « Copié » and the status announces it', async () => {
    const { fixture, buttons, status } = await renderHost();

    buttons()[1]?.click();
    await settleBounded(fixture);

    expect({
      clipboard: await navigator.clipboard.readText(),
      clicked: label(buttons()[1]).startsWith('Copié'),
      other: label(buttons()[0]).startsWith('Copier'),
      status: status(),
    }).toEqual({ clipboard: SECOND_BLOCK, clicked: true, other: true, status: COPIED });
  });

  it('Given a copied block When 2 seconds pass Then the button says « Copier » again with its own name, and the status empties', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { fixture, host, buttons, status } = await renderHost();
    const nameBefore = nameOf(buttons()[0], host);

    buttons()[0]?.click();
    await flushWithFakeTimers(fixture);
    await flushWithFakeTimers(fixture, 1999);
    const justBefore = { copied: label(buttons()[0]).startsWith('Copié'), status: status() };
    await flushWithFakeTimers(fixture, 1);

    expect({
      justBefore,
      after: {
        copier: label(buttons()[0]).startsWith('Copier'),
        name: nameOf(buttons()[0], host),
        status: status(),
      },
    }).toEqual({
      justBefore: { copied: true, status: COPIED },
      after: { copier: true, name: nameBefore, status: '' },
    });
  });

  it('Given a copied block When it is copied again after 1.5 s Then « Copié » lasts 2 s from the last click', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { fixture, buttons } = await renderHost();

    buttons()[0]?.click();
    await flushWithFakeTimers(fixture, 1500);
    buttons()[0]?.click();
    await flushWithFakeTimers(fixture, 1000);
    const at2500 = label(buttons()[0]).startsWith('Copié');
    await flushWithFakeTimers(fixture, 1000);

    expect({ at2500, at3500: label(buttons()[0]).startsWith('Copier') }).toEqual({
      at2500: true,
      at3500: true,
    });
  });

  it('Given the clipboard refuses the text When « Copier » is clicked Then the status asks to select the code and the button says « Échec »', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('The request is not allowed', 'NotAllowedError'),
    );
    const { fixture, buttons, status } = await renderHost();

    buttons()[0]?.click();
    await settleBounded(fixture);

    expect({
      status: status(),
      button: label(buttons()[0]).startsWith('Échec'),
      clipboard: await navigator.clipboard.readText(),
    }).toEqual({ status: FAILED, button: true, clipboard: 'avant' });
  });

  it('Given a failed copy When 2 seconds pass Then the button says « Copier » again with its own name, and the status empties', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new DOMException('The request is not allowed', 'NotAllowedError'),
    );
    const { fixture, host, buttons, status } = await renderHost();
    const nameBefore = nameOf(buttons()[0], host);

    buttons()[0]?.click();
    await flushWithFakeTimers(fixture);
    await flushWithFakeTimers(fixture, 1999);
    const justBefore = { failed: label(buttons()[0]).startsWith('Échec'), status: status() };
    await flushWithFakeTimers(fixture, 1);

    expect({
      justBefore,
      after: {
        copier: label(buttons()[0]).startsWith('Copier'),
        name: nameOf(buttons()[0], host),
        status: status(),
      },
    }).toEqual({
      justBefore: { failed: true, status: FAILED },
      after: { copier: true, name: nameBefore, status: '' },
    });
  });

  it('Given a block just copied When it is copied again within 2 seconds Then the status is emptied, then rewritten 100 ms later, so the second copy is announced too', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { fixture, buttons, status } = await renderHost();

    buttons()[0]?.click();
    await flushWithFakeTimers(fixture);
    const first = status();
    await flushWithFakeTimers(fixture, 500);
    buttons()[0]?.click();
    await flushWithFakeTimers(fixture);
    const emptied = status();
    await flushWithFakeTimers(fixture, 99);
    const stillEmpty = status();
    await flushWithFakeTimers(fixture, 1);

    expect({ first, emptied, stillEmpty, rewritten: status() }).toEqual({
      first: COPIED,
      emptied: '',
      stillEmpty: '',
      rewritten: COPIED,
    });
  });

  it('Given a page without clipboard access When « Copier » is clicked Then the status asks to select the code', async () => {
    const { fixture, buttons, status } = await renderHost();
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as unknown as Clipboard);

    buttons()[0]?.click();
    await settleBounded(fixture);

    expect(status()).toBe(FAILED);
  });

  it.each([
    ['the code itself', (host: HTMLElement): Element | null => host.querySelector('pre code')],
    [
      'the language label',
      (host: HTMLElement): Element | null => host.querySelector('[data-code-label]'),
    ],
    [
      'a paragraph outside the code',
      (host: HTMLElement): Element | null => byTestId(host, 'outside-code'),
    ],
  ])('Given the article When %s is clicked Then nothing is copied', async (_case, target) => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const { fixture, host, status } = await renderHost();
    const element = target(host);

    (element as HTMLElement | null)?.click();
    await settleBounded(fixture);

    expect({
      found: element !== null,
      writes: writeText.mock.calls.length,
      status: status(),
    }).toEqual({ found: true, writes: 0, status: '' });
  });

  it('Given a copied block When the page is destroyed before 2 seconds Then nothing touches the button afterwards', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { fixture, buttons } = await renderHost();
    const button = buttons()[0];

    button?.click();
    await flushWithFakeTimers(fixture);
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(2000);

    expect(label(button).startsWith('Copié')).toBe(true);
  });
});
