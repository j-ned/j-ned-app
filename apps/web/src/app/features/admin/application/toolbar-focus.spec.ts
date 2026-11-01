import { nextToolbarIndex } from './toolbar-focus';

describe('nextToolbarIndex', () => {
  it.each([
    { current: 0, key: 'ArrowRight', count: 5, expected: 1 },
    { current: 3, key: 'ArrowRight', count: 5, expected: 4 },
    { current: 4, key: 'ArrowRight', count: 5, expected: 0 },
    { current: 2, key: 'ArrowLeft', count: 5, expected: 1 },
    { current: 0, key: 'ArrowLeft', count: 5, expected: 4 },
    { current: 3, key: 'Home', count: 5, expected: 0 },
    { current: 0, key: 'Home', count: 5, expected: 0 },
    { current: 1, key: 'End', count: 5, expected: 4 },
    { current: 4, key: 'End', count: 5, expected: 4 },
    { current: 6, key: 'End', count: 12, expected: 11 },
    { current: 0, key: 'ArrowRight', count: 1, expected: 0 },
    { current: 0, key: 'ArrowLeft', count: 1, expected: 0 },
  ])(
    'Given item $current of $count When $key is pressed Then item $expected takes the focus',
    ({ current, key, count, expected }) => {
      expect(nextToolbarIndex(current, key, count)).toBe(expected);
    },
  );

  it.each(['ArrowUp', 'ArrowDown', 'Enter', ' ', 'Tab', 'PageDown', 'a'])(
    'Given the toolbar When « %s » is pressed Then the focus is not moved by the toolbar',
    (key) => {
      expect(nextToolbarIndex(2, key, 5)).toBeNull();
    },
  );
});
