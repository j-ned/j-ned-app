import { toNullableText } from './project-editorial';

describe('toNullableText (ADR-0010 §3)', () => {
  it.each([
    ['Texte', 'Texte'],
    ['  Texte  ', 'Texte'],
    ['\n\tDeux mots \t', 'Deux mots'],
    ['', null],
    ['   ', null],
    ['\n\t ', null],
  ])(
    'Given the string %p, When normalised, Then it becomes %p',
    (input, expected) => {
      expect(toNullableText(input)).toBe(expected);
    },
  );

  it.each([[null], [undefined], [42], [true]])(
    'Given the non-string %p, When normalised, Then it is returned unchanged for @IsString to judge',
    (input) => {
      expect(toNullableText(input)).toBe(input);
    },
  );

  it('Given an array or an object, When normalised, Then the same reference is returned', () => {
    const array = ['x'];
    const object = { text: 'x' };
    expect(toNullableText(array)).toBe(array);
    expect(toNullableText(object)).toBe(object);
  });
});
