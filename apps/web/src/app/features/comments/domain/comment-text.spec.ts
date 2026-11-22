import { characterCount, hasVisibleCharacter } from './comment-text';

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
    { label: 'zero-width spaces only', text: '​​', visible: false },
    { label: 'Hangul fillers only', text: 'ㅤㅤ', visible: false },
    { label: 'blank braille cells only', text: '⠀⠀', visible: false },
    { label: 'combining marks only', text: '́̂', visible: false },
  ])('Given $label When checked Then visible = $visible', ({ text, visible }) => {
    expect(hasVisibleCharacter(text)).toBe(visible);
  });
});
