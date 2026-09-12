import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './parse-markdown';

describe('parseMarkdown', () => {
  it('convertit un titre H1 en <h1> avec une ancre id', () => {
    expect(parseMarkdown('# Titre')).toContain('<h1 id="titre">Titre</h1>');
  });

  describe('ancres des titres', () => {
    it("dérive l'id du texte du titre, sans accents ni ponctuation", () => {
      expect(parseMarkdown("## L'architecture : une double enveloppe de clés")).toContain(
        '<h2 id="l-architecture-une-double-enveloppe-de-cles">',
      );
    });

    it("ignore le balisage inline dans l'id mais le garde dans le titre", () => {
      const html = parseMarkdown('## Un IV `unique` par donnée');
      expect(html).toContain('<h2 id="un-iv-unique-par-donnee">');
      expect(html).toContain('<code>unique</code>');
    });

    it('suffixe les titres en doublon pour garder des ids uniques', () => {
      const html = parseMarkdown('## Limites\n\ntexte\n\n## Limites');
      expect(html).toContain('id="limites"');
      expect(html).toContain('id="limites-2"');
    });

    it("repart de zéro à chaque article (pas de suffixe hérité d'un parse précédent)", () => {
      parseMarkdown('## Limites');
      expect(parseMarkdown('## Limites')).toContain('<h2 id="limites">');
    });
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

  it('conserve les tables GFM', () => {
    const html = parseMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  // marked laisse passer le HTML inline tel quel et `[innerHTML]` reçoit une sortie
  // bypassSecurityTrustHtml : l'assainissement doit se faire ici, avant de faire confiance.
  describe('assainit le HTML inline du Markdown', () => {
    it.each([
      ['un <script>', 'Salut <script>alert(1)</script> toi', '<script'],
      ['un gestionnaire on*', '<img src="x" onerror="alert(1)">', 'onerror'],
      ['un href javascript:', '<a href="javascript:alert(1)">clic</a>', 'javascript:'],
      ['un <iframe>', '<iframe src="https://evil.test"></iframe>', '<iframe'],
      ['un attribut style', '<p style="position:fixed">x</p>', 'style='],
      ['un lien Markdown vers javascript:', '[clic](javascript:alert(1))', 'javascript:'],
    ])('retire %s', (_label, markdown, forbidden) => {
      expect(parseMarkdown(markdown)).not.toContain(forbidden);
    });

    it('garde le texte autour du contenu retiré', () => {
      expect(parseMarkdown('Salut <script>alert(1)</script> toi')).toContain('Salut');
      expect(parseMarkdown('Salut <script>alert(1)</script> toi')).toContain('toi');
    });

    it('garde le HTML inline inoffensif', () => {
      expect(parseMarkdown('Un <kbd>Ctrl</kbd>+<kbd>L</kbd>')).toContain('<kbd>Ctrl</kbd>');
    });
  });
});
