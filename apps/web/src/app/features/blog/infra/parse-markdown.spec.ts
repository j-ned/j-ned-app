import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './parse-markdown';

describe('parseMarkdown', () => {
  it('convertit un titre H1 en <h1>', () => {
    expect(parseMarkdown('# Titre')).toContain('<h1>Titre</h1>');
  });

  it('convertit un lien Markdown en <a>', () => {
    expect(parseMarkdown('[Angular](https://angular.dev)')).toContain(
      '<a href="https://angular.dev">Angular</a>',
    );
  });

  it('convertit un bloc de code avec langage', () => {
    const html = parseMarkdown('```ts\nconst x = 1;\n```');
    expect(html).toContain('<pre>');
    expect(html).toContain('language-ts');
  });
});
