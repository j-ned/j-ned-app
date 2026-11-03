import { toFontAwesome, uniqueIcons, type IconRef } from './icon-map';

describe('toFontAwesome', () => {
  describe('Given a token with strippable prefix', () => {
    it('strips lucide- prefix when bare name is mapped', () => {
      expect(toFontAwesome('lucide-envelope')).toEqual({ id: 'envelope', style: 'solid' });
    });

    it('strips bi- prefix when bare name is mapped', () => {
      expect(toFontAwesome('bi-github')).toEqual({ id: 'github', style: 'brands' });
    });

    it('strips pi- prefix when bare name is mapped', () => {
      expect(toFontAwesome('pi-envelope')).toEqual({ id: 'envelope', style: 'solid' });
    });
  });

  describe('Given an unknown token', () => {
    it('falls back to question icon', () => {
      expect(toFontAwesome('totally-unknown-icon-xyz')).toEqual({ id: 'question', style: 'solid' });
    });

    it('falls back to question icon for null/undefined/empty', () => {
      expect(toFontAwesome(null)).toEqual({ id: 'question', style: 'solid' });
      expect(toFontAwesome(undefined)).toEqual({ id: 'question', style: 'solid' });
      expect(toFontAwesome('')).toEqual({ id: 'question', style: 'solid' });
    });
  });
});

describe('uniqueIcons', () => {
  it('returns a dedup list of style/id pairs', () => {
    const result = uniqueIcons();
    const keys = result.map((ref) => `${ref.style}/${ref.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes the fallback question icon', () => {
    const result = uniqueIcons();
    expect(result.some((ref: IconRef) => ref.id === 'question' && ref.style === 'solid')).toBe(
      true,
    );
  });
});
