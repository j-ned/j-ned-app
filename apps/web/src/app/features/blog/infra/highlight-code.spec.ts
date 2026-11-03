import { describe, it, expect } from 'vitest';
import type { CodeLanguageId } from '../domain/code-language';
import { highlightCode } from './highlight-code';

type Token = { readonly kind: string; readonly text: string };

function render(html: string): HTMLElement {
  const code = document.createElement('code');
  code.innerHTML = html;
  return code;
}

const tokensOf = (code: HTMLElement): readonly Token[] =>
  [...code.querySelectorAll('span')].map((span) => ({
    kind: span.className,
    text: span.textContent ?? '',
  }));

describe('highlightCode', () => {
  it.each<{ language: CodeLanguageId; source: string; token: Token }>([
    {
      language: 'typescript',
      source: 'type Id = string;',
      token: { kind: 'hljs-keyword', text: 'type' },
    },
    { language: 'html', source: '<p>x</p>', token: { kind: 'hljs-name', text: 'p' } },
    {
      language: 'python',
      source: 'def f():\n    return 1',
      token: { kind: 'hljs-keyword', text: 'def' },
    },
  ])(
    'Given $language source When it is highlighted Then its own grammar marks « $token.text » and the text is kept',
    ({ language, source, token }) => {
      const code = render(highlightCode(source, language));

      expect({
        marked: tokensOf(code).some(({ kind, text }) => kind === token.kind && text === token.text),
        text: code.textContent,
      }).toEqual({ marked: true, text: source });
    },
  );

  it('Given source holding markup and an ampersand When it is highlighted Then they come out escaped, never as elements', () => {
    const source = 'const s = "<script>alert(1)</script>" & 1;';

    const html = highlightCode(source, 'typescript');

    expect({
      escaped: html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && html.includes('&amp;'),
      rawTag: html.includes('<script'),
      text: render(html).textContent,
    }).toEqual({ escaped: true, rawTag: false, text: source });
  });

  it('Given JSON with a stray character When it is highlighted Then the rest is still coloured and the text is kept', () => {
    const source = '{ "a": 1, @@@ }';

    const code = render(highlightCode(source, 'json'));

    expect({
      number: tokensOf(code).some(({ kind, text }) => kind === 'hljs-number' && text === '1'),
      text: code.textContent,
    }).toEqual({ number: true, text: source });
  });

  it('Given any language When source is highlighted Then the output carries classes only, no inline style', () => {
    const html = highlightCode('<p class="a">x</p>\n<style>p { color: red; }</style>', 'html');

    expect({ style: html.includes('style="'), classes: html.includes('class="hljs-') }).toEqual({
      style: false,
      classes: true,
    });
  });
});
