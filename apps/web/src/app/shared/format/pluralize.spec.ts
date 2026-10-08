import { pluralize } from './pluralize';

describe('pluralize', () => {
  it.each([
    [0, 'message'],
    [1, 'message'],
    [2, 'messages'],
    [1500, 'messages'],
  ])('Given %i, When on accorde « message », Then on obtient « %s »', (count, expected) => {
    expect(pluralize(count, 'message', 'messages')).toBe(expected);
  });
});
