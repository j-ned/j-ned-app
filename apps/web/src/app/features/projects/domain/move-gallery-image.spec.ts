import { moveGalleryImage } from './move-gallery-image';

const IDS = ['a', 'b', 'c'] as const;

describe('moveGalleryImage', () => {
  it.each([
    { index: 0, delta: 1, expected: ['b', 'a', 'c'] },
    { index: 1, delta: 1, expected: ['a', 'c', 'b'] },
    { index: 1, delta: -1, expected: ['b', 'a', 'c'] },
    { index: 2, delta: -1, expected: ['a', 'c', 'b'] },
  ] as const)(
    'Given a, b, c When the image at $index moves by $delta Then the order is $expected',
    ({ index, delta, expected }) => {
      expect(moveGalleryImage(IDS, index, delta)).toEqual(expected);
    },
  );

  it.each([
    { index: 0, delta: -1 },
    { index: 2, delta: 1 },
    { index: -1, delta: 1 },
    { index: 3, delta: -1 },
    { index: 7, delta: 1 },
  ] as const)(
    'Given a, b, c When the image at $index moves by $delta past an edge Then the order is unchanged',
    ({ index, delta }) => {
      expect(moveGalleryImage(IDS, index, delta)).toEqual(['a', 'b', 'c']);
    },
  );

  it('Given an empty gallery When an image moves Then the gallery stays empty', () => {
    expect(moveGalleryImage([], 0, 1)).toEqual([]);
  });

  it('Given a single image When it moves Then it stays alone', () => {
    expect(moveGalleryImage(['a'], 0, 1)).toEqual(['a']);
  });

  it.each([
    { index: 0, delta: 1 },
    { index: 0, delta: -1 },
  ] as const)(
    'Given a frozen list When the image at $index moves by $delta Then a new list is returned and the input is untouched',
    ({ index, delta }) => {
      const ids = Object.freeze(['a', 'b', 'c']);

      const moved = moveGalleryImage(ids, index, delta);

      expect(moved).not.toBe(ids);
      expect(ids).toEqual(['a', 'b', 'c']);
    },
  );
});
