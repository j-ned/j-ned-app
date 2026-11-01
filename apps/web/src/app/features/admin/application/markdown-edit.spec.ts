import {
  blockLevelAt,
  markdownEdit,
  type BlockLevel,
  type InlineFormat,
  type LinePrefix,
  type MarkdownAction,
  type TextSelection,
} from './markdown-edit';

type Marked = { readonly text: string; readonly selection: TextSelection };

// « et » bornent la sélection dans les cas : ni l'un ni l'autre n'apparaît dans le Markdown testé.
const parse = (marked: string): Marked => {
  const start = marked.indexOf('«');
  const end = marked.indexOf('»') - 1;
  return { text: marked.replace('«', '').replace('»', ''), selection: { start, end } };
};

const show = (text: string, selection: TextSelection): string =>
  `${text.slice(0, selection.start)}«${text.slice(selection.start, selection.end)}»${text.slice(selection.end)}`;

const edited = (marked: string, action: MarkdownAction): string => {
  const { text, selection } = parse(marked);
  const edit = markdownEdit(text, selection, action);
  return show(text.slice(0, edit.from) + edit.text + text.slice(edit.to), edit.selection);
};

const inline = (format: InlineFormat): MarkdownAction => ({ kind: 'inline', format });
const level = (value: BlockLevel): MarkdownAction => ({ kind: 'block-level', level: value });
const linePrefix = (prefix: LinePrefix): MarkdownAction => ({ kind: 'line-prefix', prefix });
const LINK: MarkdownAction = { kind: 'link' };
const CODE_BLOCK: MarkdownAction = { kind: 'code-block' };
const RULE: MarkdownAction = { kind: 'rule' };
const IMAGE_URL = 'https://api.test/i.avif';
const image = (alt: string): MarkdownAction => ({ kind: 'image', alt, url: IMAGE_URL });

describe('markdownEdit: mise en forme en ligne', () => {
  it.each([
    { before: 'un «mot» ici', after: 'un **«mot»** ici' },
    { before: '«mot» ici', after: '**«mot»** ici' },
    { before: 'un «mot»', after: 'un **«mot»**' },
    { before: '«tout»', after: '**«tout»**' },
    { before: 'un« mot »ici', after: 'un **«mot»** ici' },
    { before: 'a «»b', after: 'a **«»**b' },
    { before: '«»', after: '**«»**' },
    { before: 'texte«»', after: 'texte**«»**' },
    { before: '«»texte', after: '**«»**texte' },
  ])('Given $before When bold is applied Then the text reads $after', ({ before, after }) => {
    expect(edited(before, inline('bold'))).toBe(after);
  });

  it.each([
    { before: '«un\ndeux»', after: '«**un**\n**deux**»' },
    { before: 'a «b\nc» d', after: 'a «**b**\n**c**» d' },
    { before: '«un\n\ndeux»', after: '«**un**\n\n**deux**»' },
    { before: '«un \n deux»', after: '«**un** \n **deux**»' },
    { before: '«**un**\ndeux»', after: '«**un**\n**deux**»' },
  ])(
    'Given a selection over several lines $before When bold is applied Then each non-empty line is wrapped: $after',
    ({ before, after }) => {
      expect(edited(before, inline('bold'))).toBe(after);
    },
  );

  it.each([
    { before: 'un **«mot»** ici', after: 'un «mot» ici' },
    { before: 'un «**mot**» ici', after: 'un «mot» ici' },
    { before: 'a **«»**b', after: 'a «»b' },
    { before: '«**un**\n**deux**»', after: '«un\ndeux»' },
    { before: 'un *«mot»* ici', after: 'un ***«mot»*** ici' },
    { before: 'un ***«mot»*** ici', after: 'un *«mot»* ici' },
  ])(
    'Given $before When bold is applied Then the bold markers toggle: $after',
    ({ before, after }) => {
      expect(edited(before, inline('bold'))).toBe(after);
    },
  );

  it.each([
    { before: 'un «mot» ici', after: 'un *«mot»* ici' },
    { before: 'a «»b', after: 'a *«»*b' },
    { before: 'un *«mot»* ici', after: 'un «mot» ici' },
    { before: 'un «*mot*» ici', after: 'un «mot» ici' },
    { before: 'un **«mot»** ici', after: 'un ***«mot»*** ici' },
    { before: 'un ***«mot»*** ici', after: 'un **«mot»** ici' },
    { before: 'un «**mot**» ici', after: 'un *«**mot**»* ici' },
  ])('Given $before When italic is applied Then the text reads $after', ({ before, after }) => {
    expect(edited(before, inline('italic'))).toBe(after);
  });

  it.each([
    { format: 'underline', before: 'un «mot» ici', after: 'un <u>«mot»</u> ici' },
    { format: 'underline', before: 'un <u>«mot»</u> ici', after: 'un «mot» ici' },
    { format: 'underline', before: 'un «<u>mot</u>» ici', after: 'un «mot» ici' },
    { format: 'underline', before: 'a «»b', after: 'a <u>«»</u>b' },
    { format: 'underline', before: 'un« mot »ici', after: 'un <u>«mot»</u> ici' },
    { format: 'strikethrough', before: 'un «mot» ici', after: 'un ~~«mot»~~ ici' },
    { format: 'strikethrough', before: 'un ~~«mot»~~ ici', after: 'un «mot» ici' },
    { format: 'strikethrough', before: 'un «~~mot~~» ici', after: 'un «mot» ici' },
    { format: 'strikethrough', before: '«un\ndeux»', after: '«~~un~~\n~~deux~~»' },
    { format: 'inline-code', before: 'un «mot» ici', after: 'un `«mot»` ici' },
    { format: 'inline-code', before: 'un `«mot»` ici', after: 'un «mot» ici' },
    { format: 'inline-code', before: 'un «`mot`» ici', after: 'un «mot» ici' },
    { format: 'inline-code', before: '«»', after: '`«»`' },
  ] as const)(
    'Given $before When $format is applied Then the text reads $after',
    ({ format, before, after }) => {
      expect(edited(before, inline(format))).toBe(after);
    },
  );

  it.each([
    ...(['bold', 'italic', 'underline', 'strikethrough', 'inline-code'] as const).flatMap(
      (format) => [
        { format, before: 'un «mot» ici' },
        { format, before: '«un\ndeux»' },
        { format, before: 'a «»b' },
      ],
    ),
  ])(
    'Given $before When $format is applied twice Then the text and the selection are back',
    ({ format, before }) => {
      expect(edited(edited(before, inline(format)), inline(format))).toBe(before);
    },
  );

  it.each([
    { before: 'un «mot» ici', format: 'bold' },
    { before: 'un **«mot»** ici', format: 'bold' },
    { before: '«un\ndeux»', format: 'underline' },
    { before: 'texte«»', format: 'inline-code' },
  ] as const)(
    'Given $before When $format is applied Then the replaced range and the new selection lie inside the texts',
    ({ before, format }) => {
      const { text, selection } = parse(before);
      const edit = markdownEdit(text, selection, inline(format));
      const length = text.length - (edit.to - edit.from) + edit.text.length;

      expect({
        range: edit.from >= 0 && edit.from <= edit.to && edit.to <= text.length,
        selection:
          edit.selection.start >= 0 &&
          edit.selection.start <= edit.selection.end &&
          edit.selection.end <= length,
      }).toEqual({ range: true, selection: true });
    },
  );
});

describe('markdownEdit: niveau de bloc', () => {
  it.each([
    { before: 'Titre«»', target: 'h2', after: '## Titre«»' },
    { before: 'Ti«»tre', target: 'h2', after: '## Ti«»tre' },
    { before: '«»Titre', target: 'h2', after: '## «»Titre' },
    { before: '«»', target: 'h2', after: '## «»' },
    { before: '# Titre«»', target: 'h3', after: '### Titre«»' },
    { before: '#### «»Titre', target: 'h2', after: '## «»Titre' },
    { before: '###### Note«»', target: 'h4', after: '#### Note«»' },
    { before: '## Titre«»', target: 'paragraph', after: 'Titre«»' },
    { before: '## Ti«»tre', target: 'paragraph', after: 'Ti«»tre' },
    { before: 'Texte«»', target: 'paragraph', after: 'Texte«»' },
    { before: '#«»# Titre', target: 'paragraph', after: '«»Titre' },
    { before: '#«»# Titre', target: 'h3', after: '### «»Titre' },
  ] as const)(
    'Given the caret in $before When the level $target is chosen Then the line reads $after',
    ({ before, target, after }) => {
      expect(edited(before, level(target))).toBe(after);
    },
  );

  it.each([
    { before: 'un\nde«»ux', target: 'h2', after: 'un\n## de«»ux' },
    { before: 'un«»\ndeux', target: 'h2', after: '## un«»\ndeux' },
    { before: 'un\n«»\ndeux', target: 'h2', after: 'un\n## «»\ndeux' },
    { before: '## un\n\nTe«»xte', target: 'h4', after: '## un\n\n#### Te«»xte' },
  ] as const)(
    'Given the caret on one line of $before When the level $target is chosen Then only that line changes: $after',
    ({ before, target, after }) => {
      expect(edited(before, level(target))).toBe(after);
    },
  );

  it.each([
    { before: '«un\ndeux»', target: 'h3', after: '«### un\n### deux»' },
    { before: 'a«b\nc»d', target: 'h2', after: '«## ab\n## cd»' },
    { before: '«un\n\ndeux»', target: 'h2', after: '«## un\n\n## deux»' },
    { before: '«## un\n# deux»', target: 'paragraph', after: '«un\ndeux»' },
    {
      before: 'avant\n«un\ndeux»\naprès',
      target: 'h4',
      after: 'avant\n«#### un\n#### deux»\naprès',
    },
  ] as const)(
    'Given a selection over $before When the level $target is chosen Then every touched non-empty line changes and the block is selected: $after',
    ({ before, target, after }) => {
      expect(edited(before, level(target))).toBe(after);
    },
  );

  it.each(['paragraph', 'h2', 'h3', 'h4'] as const)(
    'Given a line When the level %s is chosen twice Then the second choice changes nothing',
    (target) => {
      const once = edited('# Ti«»tre\nsuite', level(target));

      expect(edited(once, level(target))).toBe(once);
    },
  );
});

describe('blockLevelAt', () => {
  it.each([
    { marked: '## Titre«»', expected: 'h2' },
    { marked: '### «»T', expected: 'h3' },
    { marked: '#### T«»', expected: 'h4' },
    { marked: '«»## Titre', expected: 'h2' },
    { marked: '## «»', expected: 'h2' },
    { marked: '«»Texte', expected: 'paragraph' },
    { marked: '«»', expected: 'paragraph' },
    { marked: '##Titre«»', expected: 'paragraph' },
    { marked: '####### T«»', expected: 'paragraph' },
    { marked: '# T«»', expected: null },
    { marked: '##### T«»', expected: null },
    { marked: '###### T«»', expected: null },
  ] as const)('Given the caret in $marked Then the level is $expected', ({ marked, expected }) => {
    const { text, selection } = parse(marked);

    expect(blockLevelAt(text, selection.start)).toBe(expected);
  });

  it.each([
    { marked: 'un\n«»## deux', expected: 'h2' },
    { marked: 'un«»\n## deux', expected: 'paragraph' },
    { marked: '## un\n\n«»', expected: 'paragraph' },
    { marked: 'un\n### de«»ux\ntrois', expected: 'h3' },
    { marked: '### un\nde«»ux', expected: 'paragraph' },
  ] as const)(
    'Given the caret on one line of $marked Then the level is the one of that line: $expected',
    ({ marked, expected }) => {
      const { text, selection } = parse(marked);

      expect(blockLevelAt(text, selection.start)).toBe(expected);
    },
  );
});

describe('markdownEdit: listes et citation', () => {
  it.each([
    { prefix: 'bullet-list', before: 'Ite«»m', after: '- Ite«»m' },
    { prefix: 'bullet-list', before: '«»', after: '- «»' },
    { prefix: 'bullet-list', before: '- Ite«»m', after: 'Ite«»m' },
    { prefix: 'bullet-list', before: '1. Ite«»m', after: '- Ite«»m' },
    { prefix: 'bullet-list', before: '-«» Item', after: '«»Item' },
    { prefix: 'bullet-list', before: 'un\nde«»ux\ntrois', after: 'un\n- de«»ux\ntrois' },
    { prefix: 'ordered-list', before: 'Ite«»m', after: '1. Ite«»m' },
    { prefix: 'ordered-list', before: '«»', after: '1. «»' },
    { prefix: 'ordered-list', before: '1. Ite«»m', after: 'Ite«»m' },
    { prefix: 'ordered-list', before: '12. Ite«»m', after: 'Ite«»m' },
    { prefix: 'ordered-list', before: '- Ite«»m', after: '1. Ite«»m' },
    { prefix: 'quote', before: 'Ci«»te', after: '> Ci«»te' },
    { prefix: 'quote', before: '«»', after: '> «»' },
    { prefix: 'quote', before: '> Ci«»te', after: 'Ci«»te' },
    { prefix: 'quote', before: '- Ite«»m', after: '> - Ite«»m' },
  ] as const)(
    'Given the caret in $before When $prefix is applied Then the line reads $after',
    ({ prefix, before, after }) => {
      expect(edited(before, linePrefix(prefix))).toBe(after);
    },
  );

  it.each([
    { prefix: 'bullet-list', before: '«un\ndeux»', after: '«- un\n- deux»' },
    { prefix: 'bullet-list', before: 'a«b\nc»d', after: '«- ab\n- cd»' },
    { prefix: 'bullet-list', before: 'un «mot» ici', after: '«- un mot ici»' },
    { prefix: 'bullet-list', before: '«un\n\ndeux»', after: '«- un\n\n- deux»' },
    { prefix: 'bullet-list', before: '«- un\n- deux»', after: '«un\ndeux»' },
    { prefix: 'bullet-list', before: '«- un\ndeux»', after: '«- un\n- deux»' },
    { prefix: 'bullet-list', before: '«1. un\n2. deux»', after: '«- un\n- deux»' },
    {
      prefix: 'bullet-list',
      before: 'avant\n«un\ndeux»\naprès',
      after: 'avant\n«- un\n- deux»\naprès',
    },
    { prefix: 'bullet-list', before: '«un\n»deux', after: '«- un»\ndeux' },
    { prefix: 'ordered-list', before: '«un\ndeux\ntrois»', after: '«1. un\n2. deux\n3. trois»' },
    { prefix: 'ordered-list', before: '«un\n\ndeux»', after: '«1. un\n\n2. deux»' },
    { prefix: 'ordered-list', before: '«1. un\n2. deux»', after: '«un\ndeux»' },
    { prefix: 'ordered-list', before: '«3. un\n7. deux»', after: '«un\ndeux»' },
    { prefix: 'ordered-list', before: '«- un\n- deux»', after: '«1. un\n2. deux»' },
    { prefix: 'ordered-list', before: '«2. un\ndeux»', after: '«1. un\n2. deux»' },
    { prefix: 'quote', before: '«un\ndeux»', after: '«> un\n> deux»' },
    { prefix: 'quote', before: '«> un\n> deux»', after: '«un\ndeux»' },
    { prefix: 'quote', before: '«> un\ndeux»', after: '«> un\n> deux»' },
  ] as const)(
    'Given a selection over $before When $prefix is applied Then every touched non-empty line toggles and the block is selected: $after',
    ({ prefix, before, after }) => {
      expect(edited(before, linePrefix(prefix))).toBe(after);
    },
  );

  it.each(
    (['bullet-list', 'ordered-list', 'quote'] as const).flatMap((prefix) => [
      { prefix, before: 'Ite«»m' },
      { prefix, before: '«un\ndeux»' },
      { prefix, before: '«un\n\ndeux»' },
    ]),
  )(
    'Given $before When $prefix is applied twice Then the text and the selection are back',
    ({ prefix, before }) => {
      expect(edited(edited(before, linePrefix(prefix)), linePrefix(prefix))).toBe(before);
    },
  );
});

describe('markdownEdit: lien', () => {
  it.each([
    { before: 'un «mot» ici', after: 'un [mot](«https://») ici' },
    { before: '«tout»', after: '[tout](«https://»)' },
    { before: 'un« mot »ici', after: 'un [mot](«https://») ici' },
    { before: 'a «»b', after: 'a [«»](https://)b' },
    { before: '«»', after: '[«»](https://)' },
  ])('Given $before When a link is inserted Then the text reads $after', ({ before, after }) => {
    expect(edited(before, LINK)).toBe(after);
  });
});

describe('markdownEdit: bloc de code', () => {
  it.each([
    { before: '«»', after: '```«ts»\n\n```' },
    { before: 'Avant«»', after: 'Avant\n\n```«ts»\n\n```' },
    { before: '«»Après', after: '```«ts»\n\n```\n\nAprès' },
    { before: 'Avant\n«»', after: 'Avant\n\n```«ts»\n\n```' },
    { before: 'Avant«»\nAprès', after: 'Avant\n\n```«ts»\n\n```\n\nAprès' },
    { before: 'Avant\n\n«»\n\nAprès', after: 'Avant\n\n```«ts»\n\n```\n\nAprès' },
    { before: '«const a = 1;»', after: '```«ts»\nconst a = 1;\n```' },
    { before: 'Avant\n«x»\nAprès', after: 'Avant\n\n```«ts»\nx\n```\n\nAprès' },
    {
      before: 'Avant\n\n«const a = 1;\nconst b = 2;»\n\nAprès',
      after: 'Avant\n\n```«ts»\nconst a = 1;\nconst b = 2;\n```\n\nAprès',
    },
  ])(
    'Given $before When a code block is inserted Then it stands in its own paragraph with « ts » selected: $after',
    ({ before, after }) => {
      expect(edited(before, CODE_BLOCK)).toBe(after);
    },
  );
});

describe('markdownEdit: séparateur', () => {
  it.each([
    { before: '«»', after: '---«»' },
    { before: 'Avant«»', after: 'Avant\n\n---«»' },
    { before: '«»Après', after: '---«»\n\nAprès' },
    { before: 'Avant«»\nAprès', after: 'Avant\n\n---«»\n\nAprès' },
    { before: 'Avant\n\n«»\n\nAprès', after: 'Avant\n\n---«»\n\nAprès' },
    { before: 'Avant\n\n«x»\n\nAprès', after: 'Avant\n\n---«»\n\nAprès' },
  ])(
    'Given $before When a rule is inserted Then it stands in its own paragraph, the caret after it: $after',
    ({ before, after }) => {
      expect(edited(before, RULE)).toBe(after);
    },
  );
});

describe('markdownEdit: image', () => {
  it.each([
    { before: '«»', after: `![Schéma](${IMAGE_URL})«»` },
    { before: 'Avant«»', after: `Avant\n\n![Schéma](${IMAGE_URL})«»` },
    { before: 'Av«»ant', after: `Av\n\n![Schéma](${IMAGE_URL})«»\n\nant` },
    { before: 'Avant\n\n«»\n\nAprès', after: `Avant\n\n![Schéma](${IMAGE_URL})«»\n\nAprès` },
    { before: 'Avant\n\n«mot»\n\nAprès', after: `Avant\n\n![Schéma](${IMAGE_URL})«»\n\nAprès` },
  ])(
    'Given $before When an image is inserted Then it stands in its own paragraph, the caret after it: $after',
    ({ before, after }) => {
      expect(edited(before, image('Schéma'))).toBe(after);
    },
  );

  it.each([
    { alt: '  Schéma  ', written: 'Schéma' },
    { alt: 'Vue [v2]', written: 'Vue \\[v2\\]' },
    { alt: 'C:\\temp', written: 'C:\\\\temp' },
    { alt: '[a\\b]', written: '\\[a\\\\b\\]' },
    { alt: 'ligne un\nligne deux', written: 'ligne un ligne deux' },
    { alt: 'a\r\nb', written: 'a b' },
    { alt: '*gras* _x_', written: '\\*gras\\* \\_x\\_' },
    { alt: 'la fonction `run`', written: 'la fonction \\`run\\`' },
    { alt: '**[a_b]**', written: '\\*\\*\\[a\\_b\\]\\*\\*' },
  ])(
    'Given the alt text $alt When an image is inserted Then the alt text is written $written',
    ({ alt, written }) => {
      expect(edited('«»', image(alt))).toBe(`![${written}](${IMAGE_URL})«»`);
    },
  );
});

describe('markdownEdit: bornes des insertions', () => {
  it.each([
    { before: 'Ite«»m', action: linePrefix('ordered-list') },
    { before: '«- un\n- deux»', action: linePrefix('bullet-list') },
    { before: 'un «mot» ici', action: LINK },
    { before: 'Avant«»\nAprès', action: CODE_BLOCK },
    { before: 'Avant\n\n«x»\n\nAprès', action: RULE },
    { before: 'Av«»ant', action: image('Schéma') },
  ])(
    'Given $before When $action.kind is applied Then the replaced range and the new selection lie inside the texts',
    ({ before, action }) => {
      const { text, selection } = parse(before);
      const edit = markdownEdit(text, selection, action);
      const length = text.length - (edit.to - edit.from) + edit.text.length;

      expect({
        range: edit.from >= 0 && edit.from <= edit.to && edit.to <= text.length,
        selection:
          edit.selection.start >= 0 &&
          edit.selection.start <= edit.selection.end &&
          edit.selection.end <= length,
      }).toEqual({ range: true, selection: true });
    },
  );
});
