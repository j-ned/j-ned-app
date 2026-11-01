import { describe, it, expect } from 'vitest';
import { truncateAtWord } from './truncate-at-word';

describe('truncateAtWord', () => {
  it('rend le texte intact quand il tient', () => {
    expect(truncateAtWord('Court', 155)).toBe('Court');
  });

  it.each([
    [
      'DashFlow réunit le budget familial et le suivi médical dans une interface sombre',
      40,
      'DashFlow réunit le budget familial et…',
    ],
    ['Un mot, puis une virgule, puis la coupe', 26, 'Un mot, puis une virgule…'],
  ])('coupe « %s » à %d sans casser un mot', (text, max, expected) => {
    const out = truncateAtWord(text, max);
    expect(out).toBe(expected);
    expect(out.length).toBeLessThanOrEqual(max);
  });

  it("ne recule pas trop loin quand aucun espace n'est proche", () => {
    expect(truncateAtWord('a'.repeat(200), 20)).toBe('a'.repeat(19) + '…');
  });
});
