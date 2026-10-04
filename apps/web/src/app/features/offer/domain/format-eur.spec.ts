import { formatEur } from './format-eur';

describe('formatEur', () => {
  it.each([
    [29, '29 €'],
    [690, '690 €'],
    [4500, '4 500 €'],
  ])(
    'formats %d euros the French way, with a non-breaking space before the sign',
    (amount, label) => {
      expect(formatEur(amount)).toBe(label);
    },
  );
});
