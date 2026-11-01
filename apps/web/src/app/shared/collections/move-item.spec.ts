import { moveItem } from './move-item';

const ITEMS = ['a', 'b', 'c'] as const;

describe('moveItem', () => {
  it.each([
    { index: 0, delta: 1, expected: ['b', 'a', 'c'] },
    { index: 1, delta: 1, expected: ['a', 'c', 'b'] },
    { index: 1, delta: -1, expected: ['b', 'a', 'c'] },
    { index: 2, delta: -1, expected: ['a', 'c', 'b'] },
  ] as const)(
    'Given a, b, c When the item at $index moves by $delta Then the order is $expected',
    ({ index, delta, expected }) => {
      expect(moveItem(ITEMS, index, delta)).toEqual(expected);
    },
  );

  it.each([
    { index: 0, delta: -1 },
    { index: 2, delta: 1 },
    { index: -1, delta: 1 },
    { index: 3, delta: -1 },
    { index: 7, delta: 1 },
  ] as const)(
    'Given a, b, c When the item at $index moves by $delta past an edge Then the order is unchanged',
    ({ index, delta }) => {
      expect(moveItem(ITEMS, index, delta)).toEqual(['a', 'b', 'c']);
    },
  );

  it.each([
    { name: 'an empty list', items: [] as readonly string[], expected: [] },
    { name: 'a single item', items: ['a'], expected: ['a'] },
  ])('Given $name When an item moves Then the list is unchanged', ({ items, expected }) => {
    expect(moveItem(items, 0, 1)).toEqual(expected);
  });

  it('Given rows as objects When the second moves up Then the same rows are swapped, not copied', () => {
    const first = { id: 'r-1', text: 'Un' };
    const second = { id: 'r-2', text: 'Deux' };

    const moved = moveItem([first, second], 1, -1);

    expect({ first: moved[0] === second, second: moved[1] === first }).toEqual({
      first: true,
      second: true,
    });
  });

  it.each([
    { index: 0, delta: 1 },
    { index: 0, delta: -1 },
  ] as const)(
    'Given a frozen list When the item at $index moves by $delta Then a new list is returned and the input is untouched',
    ({ index, delta }) => {
      const items = Object.freeze(['a', 'b', 'c']);

      const moved = moveItem(items, index, delta);

      expect({ same: moved === items, input: [...items] }).toEqual({
        same: false,
        input: ['a', 'b', 'c'],
      });
    },
  );
});
