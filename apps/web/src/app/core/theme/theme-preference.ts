export type ThemePreference = 'system' | 'light' | 'dark';

export function parseThemePreference(raw: string | null): ThemePreference {
  return raw === 'dark' || raw === 'light' ? raw : 'system';
}

export function resolveIsDark(preference: ThemePreference, systemPrefersDark: boolean): boolean {
  return preference === 'system' ? systemPrefersDark : preference === 'dark';
}
