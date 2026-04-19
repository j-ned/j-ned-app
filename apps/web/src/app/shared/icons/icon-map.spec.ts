import { LUCIDE_TO_PRIMEICON, toPrimeIcon } from './icon-map';
import { PiIconPipe } from './pi-icon.pipe';

describe('toPrimeIcon', () => {
  describe('Given an explicit mapping exists', () => {
    it.each([
      { lucide: 'lucide-mail', expected: 'pi-envelope' },
      { lucide: 'lucide-log-out', expected: 'pi-sign-out' },
      { lucide: 'lucide-x', expected: 'pi-times' },
      { lucide: 'lucide-map-pin', expected: 'pi-map-marker' },
      { lucide: 'bi-twitter-x', expected: 'pi-twitter' },
      { lucide: 'valid', expected: 'pi-verified' },
      { lucide: 'spider-web', expected: 'pi-sitemap' },
    ])('When looking up "$lucide", Then returns "$expected"', ({ lucide, expected }) => {
      expect(toPrimeIcon(lucide)).toBe(expected);
    });
  });

  describe('Given no explicit mapping', () => {
    it('When the lucide name matches a pi-* name, Then strips prefix', () => {
      // "lucide-server" is not in LUCIDE_TO_PRIMEICON? actually it is. Let's pick one that's not.
      // The fallback strips prefix and returns pi-<bareName>
      expect(toPrimeIcon('lucide-somerandomname')).toBe('pi-somerandomname');
    });

    it('When token has "bi-" prefix, Then strips it', () => {
      expect(toPrimeIcon('bi-customname')).toBe('pi-customname');
    });

    it('When token has no known prefix, Then prepends pi-', () => {
      expect(toPrimeIcon('custom-icon')).toBe('pi-custom-icon');
    });
  });

  describe('LUCIDE_TO_PRIMEICON map', () => {
    it('contains at minimum 50 entries', () => {
      expect(Object.keys(LUCIDE_TO_PRIMEICON).length).toBeGreaterThanOrEqual(50);
    });

    it('all values start with "pi-"', () => {
      for (const value of Object.values(LUCIDE_TO_PRIMEICON)) {
        expect(value).toMatch(/^pi-/);
      }
    });
  });
});

describe('PiIconPipe', () => {
  const pipe = new PiIconPipe();

  it('prepends "pi " to the mapped icon class', () => {
    expect(pipe.transform('lucide-mail')).toBe('pi pi-envelope');
  });

  it('returns just "pi" when input is null or undefined', () => {
    expect(pipe.transform(null)).toBe('pi');
    expect(pipe.transform(undefined)).toBe('pi');
  });

  it('returns just "pi" when input is empty string', () => {
    expect(pipe.transform('')).toBe('pi');
  });

  it('applies fallback for unknown icons', () => {
    expect(pipe.transform('lucide-random-xyz')).toBe('pi pi-random-xyz');
  });
});
