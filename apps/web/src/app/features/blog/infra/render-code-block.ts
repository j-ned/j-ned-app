import type { CodeLanguage } from '../domain/code-language';
import { highlightCode } from './highlight-code';

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

// 32 px dans une barre de 40 : l'anneau global n'est pas rogné.
function copyButton(index: number): string {
  return `<button type="button" data-code-copy class="-mr-2 ml-auto inline-flex min-h-8 cursor-pointer items-center rounded-sm px-2 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span data-code-copy-label>Copier</span><span class="sr-only"> le bloc de code ${index}</span></button>`;
}

// Injecté par innerHTML : Tailwind ne génère ces classes que parce qu'il lit ce fichier.
export function renderCodeBlock(
  code: string,
  language: CodeLanguage | null,
  copyIndex: number | null,
): string {
  const label = language ? `<span data-code-label>${language.label}</span>` : '';
  const button = copyIndex === null ? '' : copyButton(copyIndex);
  const bar =
    label || button
      ? `<div class="flex min-h-10 items-center gap-4 border-b border-foreground/8 px-4 font-mono text-xs text-muted">${label}${button}</div>`
      : '';
  const body = language ? highlightCode(code, language.id) : escapeHtml(code);
  const codeClass = language ? `code-syntax language-${language.id}` : 'code-syntax';
  return (
    `<div data-code-block class="not-prose my-8 overflow-hidden rounded-lg border border-foreground/8 bg-foreground/4">` +
    bar +
    `<pre tabindex="0" class="overflow-x-auto p-4 font-mono text-sm leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"><code class="${codeClass}">${body}</code></pre>` +
    `</div>\n`
  );
}
