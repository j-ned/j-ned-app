import { describe, it, expect } from 'vitest';
import { contentTagHints, TAG_HINTS_MAX, type TaggedContent } from './content-tag-hints';

const KNOWN = [
  'Angular',
  'CI/CD',
  'Chiffrement côté client',
  'NestJS',
  'RxJS',
  'SEO',
  'Sécurité',
  'Tests',
];

const article = (content: Partial<TaggedContent>): TaggedContent => ({
  title: '',
  excerpt: '',
  body: '',
  ...content,
});

describe('contentTagHints', () => {
  it.each([
    { case: 'a tag in the body', body: 'Un composant Angular.', expected: ['Angular'] },
    { case: 'any case', body: 'du ANGULAR et du rxjs', expected: ['Angular', 'RxJS'] },
    { case: 'without accents', body: 'la securite avant tout', expected: ['Sécurité'] },
    {
      case: 'a phrase',
      body: 'Le chiffrement côté client de DashFlow.',
      expected: ['Chiffrement côté client'],
    },
    { case: 'punctuation in a tag', body: 'Une chaîne CI/CD sur GitHub.', expected: ['CI/CD'] },
    {
      case: 'a word inside another',
      body: 'Une testsuite, du NestJSX, un SEOmètre.',
      expected: [],
    },
    {
      case: 'a tag at the end of a sentence',
      body: 'Mes tests. Mon SEO!',
      expected: ['SEO', 'Tests'],
    },
  ])('Given $case When the article is read Then $expected is suggested', ({ body, expected }) => {
    expect(contentTagHints(KNOWN, [], article({ body }))).toEqual(expected);
  });

  it('Given code blocks, inline code and addresses When the article is read Then they are ignored', () => {
    const body = [
      'Texte sans tag.',
      '```ts',
      "import { Component } from '@angular/core';",
      '```',
      'Voir `RxJS.of()` et https://nestjs.com/seo ou [la doc](https://angular.dev/tests).',
    ].join('\n');

    expect(contentTagHints(KNOWN, [], article({ body }))).toEqual([]);
  });

  it('Given a link text naming a tag When the article is read Then the text counts, not the address', () => {
    expect(
      contentTagHints(KNOWN, [], article({ body: '[Guide NestJS](https://x.test/angular)' })),
    ).toEqual(['NestJS']);
  });

  it('Given selected tags When the article names them Then they are not suggested again, whatever the case', () => {
    expect(
      contentTagHints(KNOWN, ['angular'], article({ body: 'Angular, RxJS et NestJS.' })),
    ).toEqual(['NestJS', 'RxJS']);
  });

  it('Given tags in the title, the excerpt and the body When ranked Then the title weighs more than the excerpt, which weighs more than the body', () => {
    const hints = contentTagHints(
      KNOWN,
      [],
      article({
        title: 'Tests',
        excerpt: 'NestJS',
        body: 'Angular. RxJS.',
      }),
    );

    expect(hints).toEqual(['Tests', 'NestJS', 'Angular', 'RxJS']);
  });

  it('Given more matching tags than the maximum When ranked Then only the strongest are kept', () => {
    const body = 'Angular Angular Angular RxJS RxJS NestJS SEO Tests Sécurité CI/CD';

    expect({
      max: TAG_HINTS_MAX,
      hints: contentTagHints(KNOWN, [], article({ body })),
    }).toEqual({ max: 5, hints: ['Angular', 'RxJS', 'CI/CD', 'NestJS', 'SEO'] });
  });

  it('Given an empty article When it is read Then nothing is suggested', () => {
    expect(contentTagHints(KNOWN, [], article({}))).toEqual([]);
  });
});
