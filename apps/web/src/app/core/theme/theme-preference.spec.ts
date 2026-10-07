import { parseThemePreference, resolveIsDark, type ThemePreference } from './theme-preference';

describe('parseThemePreference', () => {
  it.each<{ raw: string | null; preference: ThemePreference }>([
    { raw: 'dark', preference: 'dark' },
    { raw: 'light', preference: 'light' },
    { raw: null, preference: 'system' },
    { raw: '', preference: 'system' },
    { raw: 'system', preference: 'system' },
    { raw: 'Dark', preference: 'system' },
    { raw: 'sepia', preference: 'system' },
  ])(
    'Given the stored value $raw When it is read Then the preference is $preference',
    ({ raw, preference }) => {
      expect(parseThemePreference(raw)).toBe(preference);
    },
  );
});

describe('resolveIsDark', () => {
  it.each<{ preference: ThemePreference; systemPrefersDark: boolean; isDark: boolean }>([
    { preference: 'dark', systemPrefersDark: false, isDark: true },
    { preference: 'dark', systemPrefersDark: true, isDark: true },
    { preference: 'light', systemPrefersDark: true, isDark: false },
    { preference: 'light', systemPrefersDark: false, isDark: false },
    { preference: 'system', systemPrefersDark: true, isDark: true },
    { preference: 'system', systemPrefersDark: false, isDark: false },
  ])(
    'Given the $preference preference and a system dark scheme at $systemPrefersDark Then the dark register is $isDark',
    ({ preference, systemPrefersDark, isDark }) => {
      expect(resolveIsDark(preference, systemPrefersDark)).toBe(isDark);
    },
  );
});
