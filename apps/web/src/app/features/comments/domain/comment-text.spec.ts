import { characterCount, hasForbiddenCharacter, hasVisibleCharacter } from './comment-text';

describe('characterCount', () => {
  it.each([
    { label: 'a plain word', text: 'ab', count: 2 },
    { label: 'spaces around the text', text: '  ab \n', count: 2 },
    { label: 'an emoji, two UTF-16 units', text: '😀', count: 1 },
    { label: 'Windows line endings', text: 'a\r\nb', count: 3 },
    { label: 'an old Mac line ending', text: 'a\rb', count: 3 },
    { label: 'an empty text', text: '', count: 0 },
  ])(
    'Given $label When counted as the API does Then it holds $count characters',
    ({ text, count }) => {
      expect(characterCount(text)).toBe(count);
    },
  );
});

describe('hasVisibleCharacter', () => {
  it.each([
    { label: 'a name', text: 'Camille', visible: true },
    { label: 'a non-Latin script', text: '山田', visible: true },
    { label: 'a punctuation mark', text: '…', visible: true },
    { label: 'an emoji', text: '👍', visible: true },
    { label: 'spaces only', text: '   ', visible: false },
    { label: 'zero-width spaces only', text: '\u200B\u200B', visible: false },
    { label: 'Hangul fillers only', text: '\u3164\u3164', visible: false },
    { label: 'blank braille cells only', text: '\u2800\u2800', visible: false },
    { label: 'combining marks only', text: '\u0301\u0302', visible: false },
  ])('Given $label When checked Then visible = $visible', ({ text, visible }) => {
    expect(hasVisibleCharacter(text)).toBe(visible);
  });
});

describe('hasForbiddenCharacter', () => {
  it.each([
    { label: 'a tab', text: 'Ca\tmille', name: true, body: false },
    { label: 'a line feed', text: 'a\nb', name: true, body: false },
    { label: 'a Windows line ending', text: 'a\r\nb', name: true, body: false },
    { label: 'a NUL', text: 'a\u0000b', name: true, body: true },
    { label: 'an escape', text: 'a\u001B[31m', name: true, body: true },
    { label: 'a C1 control', text: 'a\u0085b', name: true, body: true },
    { label: 'a right-to-left override', text: 'Camille\u202Eellimac', name: true, body: true },
    { label: 'a directional isolate', text: 'a\u2066x\u2069', name: true, body: true },
    { label: 'a zero-width space', text: 'Ca\u200Bmille', name: true, body: true },
    { label: 'a byte order mark', text: 'Ca\uFEFFmille', name: true, body: true },
    { label: 'a soft hyphen', text: 'Ca\u00ADmille', name: true, body: true },
    { label: 'a lone high surrogate', text: 'Ca\uD800mille', name: true, body: true },
    { label: 'a lone low surrogate', text: 'Camille\uDC00', name: true, body: true },
    {
      label: 'an emoji joined by a zero-width joiner',
      text: '\u{1F469}\u200D\u{1F4BB}',
      name: false,
      body: false,
    },
    { label: 'accents written as combining marks', text: 'Zoe\u0308', name: false, body: false },
    { label: 'markup', text: '<app-root> & <img src=x>', name: false, body: false },
  ])(
    'Given $label When checked as the API does Then refused in a name = $name, in a message = $body',
    ({ text, name, body }) => {
      expect([hasForbiddenCharacter(text, 'name'), hasForbiddenCharacter(text, 'body')]).toEqual([
        name,
        body,
      ]);
    },
  );
});
