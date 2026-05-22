import { ICON_MAP, toFontAwesome, uniqueIcons, type IconRef } from './icon-map';

describe('toFontAwesome', () => {
  describe('Given an explicit mapping', () => {
    it.each([
      { token: 'lucide-mail', expected: { id: 'envelope', style: 'solid' } },
      { token: 'lucide-log-out', expected: { id: 'right-from-bracket', style: 'solid' } },
      { token: 'lucide-x', expected: { id: 'xmark', style: 'solid' } },
      { token: 'lucide-map-pin', expected: { id: 'location-dot', style: 'solid' } },
      { token: 'bi-twitter-x', expected: { id: 'x-twitter', style: 'brands' } },
      { token: 'bi-discord', expected: { id: 'discord', style: 'brands' } },
      { token: 'lucide-github', expected: { id: 'github', style: 'brands' } },
      { token: 'spider-web', expected: { id: 'sitemap', style: 'solid' } },
      { token: 'valid', expected: { id: 'circle-check', style: 'solid' } },
    ])('returns the right IconRef for "$token"', ({ token, expected }) => {
      expect(toFontAwesome(token)).toEqual(expected);
    });
  });

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

describe('ICON_MAP integrity', () => {
  it('contains at least 100 entries (covers the 51 PrimeIcons + Lucide aliases)', () => {
    expect(Object.keys(ICON_MAP).length).toBeGreaterThanOrEqual(100);
  });

  it('every entry has a valid style', () => {
    const validStyles = ['solid', 'brands', 'regular'] as const;
    for (const ref of Object.values(ICON_MAP)) {
      expect(validStyles).toContain(ref.style);
    }
  });

  it('every entry has a non-empty id', () => {
    for (const ref of Object.values(ICON_MAP)) {
      expect(ref.id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
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
    expect(result.some((ref: IconRef) => ref.id === 'question' && ref.style === 'solid')).toBe(true);
  });
});
