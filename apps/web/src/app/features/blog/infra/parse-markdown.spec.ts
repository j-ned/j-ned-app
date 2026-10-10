import { describe, it, expect } from 'vitest';
import { accessibleName } from '@shared/testing/accessible-name';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { parseMarkdown } from './parse-markdown';

describe('parseMarkdown', () => {
  it('convertit un titre H1 en <h1> avec une ancre id', () => {
    expect(parseMarkdown('# Titre')).toContain('<h1 id="titre">Titre</h1>');
  });

  describe('niveau du titre le plus haut', () => {
    it.each([
      ['# Titre\n\n### Partie', ['<h2 id="titre">', '<h4 id="partie">']],
      ['## Partie\n\n### Détail', ['<h2 id="partie">', '<h3 id="detail">']],
      ['# Titre\n\n###### Note', ['<h2 id="titre">', '<h6 id="note">']],
    ])('avec un plafond h2, « %s » descend juste assez, sans dépasser h6', (markdown, expected) => {
      const html = parseMarkdown(markdown, { topHeadingLevel: 2 });
      expect(expected.filter((tag) => !html.includes(tag))).toEqual([]);
    });

    it("ne garde ni le plafond ni le titre le plus haut d'un appel précédent", () => {
      parseMarkdown('# Titre', { topHeadingLevel: 2 });
      expect(parseMarkdown('# Titre')).toContain('<h1 id="titre">');
      parseMarkdown('# Titre\n\n## Partie', { topHeadingLevel: 2 });
      expect(parseMarkdown('## Partie', { topHeadingLevel: 2 })).toContain('<h2 id="partie">');
    });
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

  describe('blocs de code', () => {
    const render = (markdown: string): HTMLElement => {
      const root = document.createElement('div');
      root.innerHTML = parseMarkdown(markdown);
      return root;
    };

    const fence = (info: string, source: string): string => `\`\`\`${info}\n${source}\n\`\`\``;

    const handlersAndStyles = (root: HTMLElement): readonly string[] =>
      [...root.querySelectorAll('*')].flatMap((element) =>
        element
          .getAttributeNames()
          .filter((name) => name === 'style' || name.startsWith('on'))
          .map((name) => `${element.tagName.toLowerCase()}[${name}]`),
      );

    it.each([
      { info: 'ts', id: 'typescript', label: 'TypeScript', source: 'type Id = string;' },
      { info: 'typescript', id: 'typescript', label: 'TypeScript', source: 'type Id = string;' },
      { info: 'js', id: 'javascript', label: 'JavaScript', source: 'const answer = 42;' },
      { info: 'javascript', id: 'javascript', label: 'JavaScript', source: 'const answer = 42;' },
      { info: 'html', id: 'html', label: 'HTML', source: '<p class="a">x</p>' },
      { info: 'css', id: 'css', label: 'CSS', source: '.card { color: red; }' },
      { info: 'scss', id: 'scss', label: 'SCSS', source: '$gap: 4px;' },
      { info: 'json', id: 'json', label: 'JSON', source: '{ "a": 1 }' },
      { info: 'bash', id: 'bash', label: 'Bash', source: 'echo "$HOME"' },
      { info: 'sh', id: 'bash', label: 'Bash', source: 'echo "$HOME"' },
      { info: 'shell', id: 'bash', label: 'Bash', source: 'echo "$HOME"' },
      { info: 'sql', id: 'sql', label: 'SQL', source: 'SELECT id FROM posts;' },
      { info: 'yaml', id: 'yaml', label: 'YAML', source: 'name: ci' },
      { info: 'yml', id: 'yaml', label: 'YAML', source: 'name: ci' },
      { info: 'md', id: 'markdown', label: 'Markdown', source: '# Titre' },
      { info: 'markdown', id: 'markdown', label: 'Markdown', source: '# Titre' },
      { info: 'dockerfile', id: 'dockerfile', label: 'Dockerfile', source: 'RUN pnpm install' },
      { info: 'docker', id: 'dockerfile', label: 'Dockerfile', source: 'RUN pnpm install' },
      { info: 'py', id: 'python', label: 'Python', source: 'def f():\n    return 1' },
      { info: 'python', id: 'python', label: 'Python', source: 'def f():\n    return 1' },
    ])(
      'Given a « $info » block When it is rendered Then it is labelled $label, coloured, and keeps its text without style or handler',
      ({ info, id, label, source }) => {
        const root = render(fence(info, source));
        const code = root.querySelector('pre > code');

        expect({
          label: root.querySelector('[data-code-label]')?.textContent?.trim(),
          language: code?.classList.contains(`language-${id}`),
          coloured: [...(code?.querySelectorAll('span') ?? [])].some((span) =>
            [...span.classList].some((name) => name.startsWith('hljs-')),
          ),
          text: code?.textContent?.replace(/\n$/, ''),
          unsafe: handlersAndStyles(root),
        }).toEqual({ label, language: true, coloured: true, text: source, unsafe: [] });
      },
    );

    it.each([
      ['TS title="main.ts"', 'TypeScript'],
      ['Python', 'Python'],
    ])(
      'Given the info string « %s » When the block is rendered Then its first word, whatever the case, gives the label %s',
      (info, label) => {
        expect(
          render(fence(info, 'x')).querySelector('[data-code-label]')?.textContent?.trim(),
        ).toBe(label);
      },
    );

    it('Given a block When it is rendered Then one block holds its label before a keyboard-scrollable pre, with no copy button by default', () => {
      const root = render('Avant\n\n' + fence('ts', 'const x = 1;') + '\n\nAprès');
      const block = root.querySelector('[data-code-block]');
      const label = block?.querySelector('[data-code-label]');
      const pre = block?.querySelector('pre');

      expect({
        blocks: root.querySelectorAll('[data-code-block]').length,
        pres: root.querySelectorAll('pre').length,
        tabindex: pre?.getAttribute('tabindex'),
        labelFirst:
          label && pre ? label.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
        buttons: root.querySelectorAll('button, [data-code-copy]').length,
      }).toEqual({
        blocks: 1,
        pres: 1,
        tabindex: '0',
        labelFirst: Node.DOCUMENT_POSITION_FOLLOWING,
        buttons: 0,
      });
    });

    it.each([
      ['an unknown language', fence('rust', 'fn main() { let s = "<b>x</b>"; }')],
      ['no language', fence('', 'fn main() { let s = "<b>x</b>"; }')],
      ['an indented block', '    fn main() { let s = "<b>x</b>"; }'],
    ])(
      'Given %s When the block is rendered Then its text is escaped, scrollable with the keyboard, without label nor colouring',
      (_case, markdown) => {
        const html = parseMarkdown(markdown);
        const root = render(markdown);
        const pre = root.querySelector('pre');

        expect({
          text: pre?.querySelector('code')?.textContent?.replace(/\n$/, ''),
          bold: root.querySelectorAll('b').length,
          tabindex: pre?.getAttribute('tabindex'),
          label: root.querySelectorAll('[data-code-label]').length,
          coloured: html.includes('hljs'),
        }).toEqual({
          text: 'fn main() { let s = "<b>x</b>"; }',
          bold: 0,
          tabindex: '0',
          label: 0,
          coloured: false,
        });
      },
    );

    it.each([['html'], [''], ['rust']])(
      'Given a « %s » block holding a script When it is rendered Then the script is shown as text, never as an element',
      (info) => {
        const root = render(fence(info, '<script>alert(1)</script>'));

        expect({
          scripts: root.querySelectorAll('script').length,
          text: root.querySelector('pre code')?.textContent?.replace(/\n$/, ''),
        }).toEqual({ scripts: 0, text: '<script>alert(1)</script>' });
      },
    );

    it('Given an article mixing coloured code and hostile inline HTML When it is rendered Then the hljs classes stay and no style nor handler survives', () => {
      const root = render(
        [
          '<p style="position:fixed" onclick="alert(1)">x</p>',
          fence('html', '<div class="a" onclick="x()">y</div>'),
          fence('css', 'p { color: red; }'),
        ].join('\n\n'),
      );

      const colouredSpans = [...root.querySelectorAll('pre code span')].filter((span) =>
        [...span.classList].some((name) => name.startsWith('hljs-')),
      );

      expect({
        unsafe: handlersAndStyles(root),
        colouredInBothBlocks: [...root.querySelectorAll('pre code')].map((code) =>
          colouredSpans.some((span) => code.contains(span)),
        ),
      }).toEqual({ unsafe: [], colouredInBothBlocks: [true, true] });
    });
  });

  describe('bouton « Copier »', () => {
    const render = (
      markdown: string,
      options: Parameters<typeof parseMarkdown>[1],
    ): HTMLElement => {
      const root = document.createElement('div');
      root.innerHTML = parseMarkdown(markdown, options);
      return root;
    };

    const ARTICLE = [
      '```ts\nconst a = 1;\n```',
      '```ts\nconst b = 2;\n```',
      '```rust\nfn main() {}\n```',
      '    echo indenté',
    ].join('\n\n');

    it('Given the copy option When an article with four blocks is rendered Then each block holds one plain button, before its pre, named « Copier » and distinctly', () => {
      const root = render(ARTICLE, { codeCopyButton: true });
      const blocks = [...root.querySelectorAll('[data-code-block]')];
      const buttons = blocks.map((block) => block.querySelectorAll('button[data-code-copy]'));
      const names = buttons.map((found) => (found[0] ? accessibleName(found[0], root) : ''));

      expect({
        blocks: blocks.length,
        buttonsPerBlock: buttons.map((found) => found.length),
        types: buttons.map((found) => found[0]?.getAttribute('type')),
        beforePre: blocks.map((block) => {
          const button = block.querySelector('button');
          const pre = block.querySelector('pre');
          return button && pre
            ? button.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING
            : 0;
        }),
        namedCopier: names.map((name) => name.startsWith('Copier')),
        distinctNames: new Set(names).size,
        visibleFocus: buttons.map((found) =>
          [...(found[0]?.classList ?? [])].some((name) => name.startsWith('focus-visible:')),
        ),
      }).toEqual({
        blocks: 4,
        buttonsPerBlock: [1, 1, 1, 1],
        types: ['button', 'button', 'button', 'button'],
        beforePre: Array(4).fill(Node.DOCUMENT_POSITION_FOLLOWING),
        namedCopier: [true, true, true, true],
        distinctNames: 4,
        visibleFocus: [true, true, true, true],
      });
    });

    it.each([[{}], [{ codeCopyButton: false }]])(
      'Given the options %o When an article is rendered Then no block carries a button',
      (options) => {
        expect(render(ARTICLE, options).querySelectorAll('button, [data-code-copy]').length).toBe(
          0,
        );
      },
    );

    it('Given the copy option When the same article is rendered twice Then both renders are identical', () => {
      const first = parseMarkdown(ARTICLE, { codeCopyButton: true });

      expect(parseMarkdown(ARTICLE, { codeCopyButton: true })).toBe(first);
    });

    it('Given the copy option and hostile inline HTML When the article is rendered Then no style nor handler survives and the copy hooks stay', () => {
      const root = render(
        ['<p style="position:fixed" onclick="alert(1)">x</p>', '```ts\nconst a = 1;\n```'].join(
          '\n\n',
        ),
        { codeCopyButton: true },
      );

      expect({
        unsafe: [...root.querySelectorAll('*')].flatMap((element) =>
          element
            .getAttributeNames()
            .filter((name) => name === 'style' || name.startsWith('on'))
            .map((name) => `${element.tagName.toLowerCase()}[${name}]`),
        ),
        hooks: root.querySelectorAll('[data-code-block] button[data-code-copy]').length,
      }).toEqual({ unsafe: [], hooks: 1 });
    });
  });

  describe('images du corps', () => {
    const KEY = '3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f-a1b2c3d4';
    const CONTENT_IMAGE = `https://api.nedellec-julien.fr/api/storage/portfolio-storage/blog-content/${KEY}-1600x900.avif`;

    const imageOf = (markdown: string): HTMLImageElement | null => {
      const root = document.createElement('div');
      root.innerHTML = parseMarkdown(markdown);
      return root.querySelector('img');
    };

    const attributesOf = (
      image: HTMLImageElement | null,
    ): Readonly<Record<string, string | null | undefined>> => ({
      src: image?.getAttribute('src'),
      alt: image?.getAttribute('alt'),
      width: image?.getAttribute('width'),
      height: image?.getAttribute('height'),
      loading: image?.getAttribute('loading'),
      decoding: image?.getAttribute('decoding'),
    });

    it.each([
      { href: CONTENT_IMAGE, width: '1600', height: '900' },
      {
        href: `/api/storage/portfolio-storage/blog-content/${KEY}-800x1200.avif`,
        width: '800',
        height: '1200',
      },
      { href: 'https://example.com/schema.png', width: null, height: null },
      {
        href: `https://api.nedellec-julien.fr/api/storage/portfolio-storage/blog/${KEY}.avif`,
        width: null,
        height: null,
      },
    ])(
      'Given the image $href When it is rendered Then it is lazy, decoded asynchronously, with width $width and height $height',
      ({ href, width, height }) => {
        expect(attributesOf(imageOf(`![Schéma de l’architecture](${href})`))).toEqual({
          src: href,
          alt: 'Schéma de l’architecture',
          width,
          height,
          loading: 'lazy',
          decoding: 'async',
        });
      },
    );

    describe("avec l'origine des images du flux RSS", () => {
      const RELATIVE = `/api/storage/portfolio-storage/blog-content/${KEY}-1600x900.avif`;

      const withImageOrigin = (
        imageOrigin: string,
      ): NonNullable<Parameters<typeof parseMarkdown>[1]> & { readonly imageOrigin: string } => ({
        imageOrigin,
      });

      const feedImageOf = (markdown: string): HTMLImageElement | null => {
        const root = document.createElement('div');
        root.innerHTML = parseMarkdown(markdown, withImageOrigin(SITE_IDENTITY.siteUrl));
        return root.querySelector('img');
      };

      it.each([
        {
          case: 'an image served from the site',
          href: RELATIVE,
          src: `${SITE_IDENTITY.siteUrl}${RELATIVE}`,
          width: '1600',
          height: '900',
        },
        {
          case: 'an absolute image of the API',
          href: CONTENT_IMAGE,
          src: CONTENT_IMAGE,
          width: '1600',
          height: '900',
        },
        {
          case: 'an image of another host',
          href: 'https://example.com/schema.png',
          src: 'https://example.com/schema.png',
          width: null,
          height: null,
        },
        {
          case: 'a protocol-relative image',
          href: '//cdn.test/schema.png',
          src: '//cdn.test/schema.png',
          width: null,
          height: null,
        },
      ])(
        'Given $case When it is rendered for the feed Then its src is $src with width $width and height $height',
        ({ href, src, width, height }) => {
          const image = feedImageOf(`![Schéma](${href})`);

          expect({
            src: image?.getAttribute('src'),
            width: image?.getAttribute('width'),
            height: image?.getAttribute('height'),
          }).toEqual({ src, width, height });
        },
      );

      it('Given a feed rendering When the article page is rendered next Then its image stays served from the site', () => {
        feedImageOf(`![Schéma](${RELATIVE})`);

        expect(imageOf(`![Schéma](${RELATIVE})`)?.getAttribute('src')).toBe(RELATIVE);
      });
    });

    it('Given an image with a title When it is rendered Then the title stays', () => {
      expect(imageOf(`![Schéma](${CONTENT_IMAGE} "Vue d’ensemble")`)?.getAttribute('title')).toBe(
        'Vue d’ensemble',
      );
    });

    it('Given an alternative text that tries to leave its attribute When the image is rendered Then the whole text stays in alt and no handler appears', () => {
      const image = imageOf(`![x" onerror="alert(1)](${CONTENT_IMAGE})`);

      expect({
        alt: image?.getAttribute('alt'),
        handlers: image?.getAttributeNames().filter((name) => name.startsWith('on')),
      }).toEqual({ alt: 'x" onerror="alert(1)', handlers: [] });
    });
  });

  describe('souligné', () => {
    it('Given underlined HTML with a style and a handler When it is rendered Then the u element stays, bare', () => {
      const root = document.createElement('div');
      root.innerHTML = parseMarkdown(
        'Un <u style="color:red" onclick="alert(1)">mot</u> souligné et <s>barré</s>.',
      );
      const underline = root.querySelector('u');

      expect({
        text: underline?.textContent,
        attributes: underline?.getAttributeNames(),
        strike: root.querySelector('s')?.textContent,
      }).toEqual({ text: 'mot', attributes: [], strike: 'barré' });
    });
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
      ['un élément <style>', 'Avant <style>body{background:red}</style> après', '<style'],
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

    it.each([
      ['sans type', '<button>Envoyer</button>'],
      ['en submit', '<button type="submit">Envoyer</button>'],
      ['en reset', '<button type="reset">Envoyer</button>'],
    ])(
      'force type="button" sur un <button> brut %s : dans le formulaire de l\'aperçu, il ne soumet rien',
      (_label, markdown) => {
        const template = document.createElement('template');
        template.innerHTML = parseMarkdown(`Avant ${markdown} après`);
        const types = [...template.content.querySelectorAll('button')].map((button) =>
          button.getAttribute('type'),
        );
        expect(types).toEqual(['button']);
      },
    );
  });
});
