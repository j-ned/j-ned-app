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

const codePoint = (char: string): string =>
  `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`;

const excerptAround = (text: string, index: number): string =>
  text
    .slice(Math.max(0, index - 20), index + 20)
    .replaceAll(' ', '␠')
    .replaceAll(NBSP, '⍽')
    .replaceAll(NARROW_NBSP, '⌴');

export const frenchTypographyViolations = (text: string, path: string): string[] =>
  RULES.flatMap(({ pattern, expected, sign }) =>
    [...text.matchAll(pattern)].flatMap((match) => {
      const space = sign === '«' ? match[2] : match[1];
      if (space === expected) return [];
      return [
        `${path}: ${codePoint(space)} next to "${sign}", expected ${codePoint(expected)} in "${excerptAround(text, match.index)}"`,
      ];
    }),
  );
