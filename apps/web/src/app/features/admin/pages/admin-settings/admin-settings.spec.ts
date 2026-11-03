import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSettings } from './admin-settings';
import { AuthStore } from '@core/auth/auth-store';
import {
  installSystemColorScheme,
  type SystemColorScheme,
} from '@core/theme/testing/system-color-scheme';
import type { ThemePreference } from '@core/theme/theme-preference';
import { ThemeStore } from '@core/theme/theme-store';
import { makeUser } from '@features/auth/testing/user-builders';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';

const STORAGE_KEY = 'j-ned:theme';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

@Component({ template: '' })
class SecurityStub {}

async function render(stored: string | null = null): Promise<{
  fixture: ComponentFixture<AdminSettings>;
  host: HTMLElement;
  logout: ReturnType<typeof vi.fn>;
}> {
  if (stored !== null) localStorage.setItem(STORAGE_KEY, stored);
  const logout = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin/settings/security', component: SecurityStub }]),
      {
        provide: AuthStore,
        useValue: {
          currentUser: () => makeUser({ email: 'julien@example.fr' }),
          logout,
        } as unknown as AuthStore,
      },
    ],
  });
  const fixture = TestBed.createComponent(AdminSettings);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, logout };
}

const radio = (host: HTMLElement, preference: ThemePreference): HTMLInputElement | null =>
  byTestId(host, `theme-option-${preference}`) as HTMLInputElement | null;

const checkedOptions = (host: HTMLElement): readonly ThemePreference[] =>
  PREFERENCES.filter((preference) => radio(host, preference)?.checked === true);

let scheme: SystemColorScheme | null = null;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('app-dark');
  scheme = installSystemColorScheme(false);
});

afterEach(() => {
  scheme?.restore();
  scheme = null;
  localStorage.clear();
  document.documentElement.classList.remove('app-dark');
});

describe('AdminSettings: sécurité', () => {
  it('Given a signed-in user When « Se déconnecter » is pressed Then the session is closed once', async () => {
    const { fixture, host, logout } = await render();

    byTestId(host, 'settings-logout')?.click();
    await settle(fixture);

    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe('AdminSettings: thème', () => {
  it.each([
    { stored: null, checked: ['system'] },
    { stored: 'dark', checked: ['dark'] },
  ])(
    'Given the stored theme is $stored When the page renders Then only $checked is checked',
    async ({ stored, checked }) => {
      const { host } = await render(stored);

      expect(checkedOptions(host)).toEqual(checked);
    },
  );

  it.each([
    { from: null, choice: 'dark' as const, stored: 'dark', htmlDark: true },
    { from: 'dark', choice: 'system' as const, stored: null, htmlDark: false },
  ])(
    'Given the stored theme is $from When « $choice » is chosen Then the store, the browser storage and the page follow',
    async ({ from, choice, stored, htmlDark }) => {
      const { fixture, host } = await render(from);

      radio(host, choice)?.click();
      await settle(fixture);

      expect({
        preference: TestBed.inject(ThemeStore).preference(),
        stored: localStorage.getItem(STORAGE_KEY),
        htmlDark: document.documentElement.classList.contains('app-dark'),
        checked: checkedOptions(host),
      }).toEqual({ preference: choice, stored, htmlDark, checked: [choice] });
    },
  );
});
