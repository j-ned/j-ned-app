import { EDITORIAL_SOURCES, editorialTexts } from './testing/editorial-sources';

const NBSP = '\u00a0';
const NARROW_NBSP = '\u202f';

type Rule = { readonly pattern: RegExp; readonly expected: string; readonly sign: string };

const RULES: readonly Rule[] = [
  { pattern: /(\s)(:)/gu, expected: NBSP, sign: ':' },
  { pattern: /(\s)([;?!])/gu, expected: NARROW_NBSP, sign: ';?!' },
  { pattern: /(«)(\s)/gu, expected: NBSP, sign: '«' },
  { pattern: /(\s)(»)/gu, expected: NBSP, sign: '»' },
  { pattern: /(\s)([%€])/gu, expected: NBSP, sign: '%€' },
];

// Technical strings (links, paths, addresses) are not prose: a colon or "?" there is syntax.
const TECHNICAL_VALUE = /^(https?:\/\/|mailto:|tel:|\/)\S*$/u;

const codePoint = (char: string): string =>
  `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`;

const excerptAround = (text: string, index: number): string =>
  text
    .slice(Math.max(0, index - 20), index + 20)
    .replaceAll(' ', '␠')
    .replaceAll(NBSP, '⍽')
    .replaceAll(NARROW_NBSP, '⌴');

const violationsIn = (text: string, path: string): string[] =>
  RULES.flatMap(({ pattern, expected, sign }) =>
    [...text.matchAll(pattern)].flatMap((match) => {
      const space = sign === '«' ? match[2] : match[1];
      if (space === expected) return [];
      return [
        `${path}: ${codePoint(space)} next to "${sign}", expected ${codePoint(expected)} in "${excerptAround(text, match.index)}"`,
      ];
    }),
  );

const collectViolations = (value: unknown, path: string): string[] =>
  editorialTexts(value, path).flatMap(({ path: textPath, text }) =>
    TECHNICAL_VALUE.test(text) ? [] : violationsIn(text, textPath),
  );

describe('French typography of editorial content', () => {
  it.each(EDITORIAL_SOURCES)(
    '%s puts a no-break space before : ; ? ! % € and inside « », never an ordinary space',
    (name, source) => {
      expect(collectViolations(source, name)).toEqual([]);
    },
  );
});

describe('editorial typography checker', () => {
  it.each([
    ['a colon after a no-break space', `Prix${NBSP}: 890`],
    ['a question mark after a narrow no-break space', `Combien de temps${NARROW_NBSP}?`],
    ['quotes padded with no-break spaces', `«${NBSP}clé en main${NBSP}»`],
    ['a percent sign after a no-break space', `100${NBSP}%`],
    ['a clock time without any space', 'livré à 12:30'],
    ['a link', 'https://example.com/path?query=1'],
  ])('accepts %s', (_label, text) => {
    expect(collectViolations(text, 'sample')).toEqual([]);
  });

  it.each([
    ['an ordinary space before a colon', 'Prix : 890', 'U+0020 next to ":"'],
    ['an ordinary space before a semicolon', 'vite ; bien', 'U+0020 next to ";?!"'],
    ['an ordinary space before an exclamation mark', 'Allons-y !', 'U+0020 next to ";?!"'],
    ['a no-break space before a question mark', `Pourquoi${NBSP}?`, 'U+00A0 next to ";?!"'],
    ['a narrow no-break space before a colon', `Prix${NARROW_NBSP}: 890`, 'U+202F next to ":"'],
    ['an ordinary space after an opening quote', `« clé${NBSP}»`, 'U+0020 next to "«"'],
    ['an ordinary space before a closing quote', `«${NBSP}clé »`, 'U+0020 next to "»"'],
    ['an ordinary space before a euro sign', '890 €', 'U+0020 next to "%€"'],
  ])('rejects %s', (_label, text, reason) => {
    expect(collectViolations({ nested: [text] }, 'sample')).toEqual([
      expect.stringContaining(`sample.nested[0]: ${reason}`),
    ]);
  });
});
