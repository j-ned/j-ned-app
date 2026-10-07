import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminSettings } from './admin-settings';
import { AuthStore } from '@core/auth/auth-store';
import {
  installSystemColorScheme,
  type SystemColorScheme,
} from '@core/theme/testing/system-color-scheme';
import type { ThemePreference } from '@core/theme/theme-preference';
import { ThemeStore } from '@core/theme/theme-store';
import { makeUser } from '@features/auth/testing/user-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';

const STORAGE_KEY = 'j-ned:theme';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

@Component({ template: '' })
class SecurityStub {}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

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

describe('AdminSettings: en-tête de page', () => {
  it('Given a signed-in user When the page renders Then its single h1 is « Paramètres » under the account email', async () => {
    const { host } = await render();

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: 'julien@example.fr', title: 'Paramètres', headings: 1 });
  });

  it('Given the settings page When it renders Then its sections are « Sécurité » then « Apparence »', async () => {
    const { host } = await render();

    expect([...host.querySelectorAll('h2')].map((heading) => normalized(heading))).toEqual([
      'Sécurité',
      'Apparence',
    ]);
  });
});

describe('AdminSettings: sécurité', () => {
  it('Given the two-factor setting When « Configurer » is followed Then the security page opens', async () => {
    const { fixture, host } = await render();
    const link = byTestId(host, 'settings-two-factor-link');

    link?.click();
    await settle(fixture);

    expect({
      tag: link?.tagName,
      name: normalized(link),
      url: TestBed.inject(Router).url,
    }).toEqual({ tag: 'A', name: 'Configurer', url: '/admin/settings/security' });
  });

  it('Given a signed-in user When the session setting renders Then it names the account', async () => {
    const { host } = await render();

    expect(normalized(byTestId(host, 'settings-session'))).toBe(
      'Connecté en tant que julien@example.fr.',
    );
  });

  it('Given a signed-in user When « Se déconnecter » is pressed Then the session is closed once', async () => {
    const { fixture, host, logout } = await render();
    const button = byTestId(host, 'settings-logout');

    button?.click();
    await settle(fixture);

    expect({
      tag: button?.tagName,
      type: button?.getAttribute('type'),
      name: normalized(button),
      logouts: logout.mock.calls.length,
    }).toEqual({ tag: 'BUTTON', type: 'button', name: 'Se déconnecter', logouts: 1 });
  });
});

describe('AdminSettings: thème', () => {
  it('Given the appearance setting When it renders Then a fieldset titled « Thème de l’administration » offers three native radios', async () => {
    const { host } = await render();
    const fieldset = byTestId(host, 'theme-fieldset');
    const radios = PREFERENCES.map((preference) => radio(host, preference));

    expect({
      tag: fieldset?.tagName,
      legend: normalized(fieldset?.querySelector('legend')),
      hint: normalized(byTestId(host, 'theme-hint')),
      hintInFieldset: fieldset?.contains(byTestId(host, 'theme-hint')) ?? false,
      types: radios.map((input) => input?.type),
      sameGroup: new Set(radios.map((input) => input?.name)).size === 1 && radios[0]?.name !== '',
      inFieldset: radios.every((input) => input !== null && fieldset?.contains(input)),
      labels: radios.map((input) => normalized(input?.labels?.[0])),
    }).toEqual({
      tag: 'FIELDSET',
      legend: "Thème de l'administration",
      hint: 'Le même réglage que sur le site public, enregistré dans ce navigateur.',
      hintInFieldset: true,
      types: ['radio', 'radio', 'radio'],
      sameGroup: true,
      inFieldset: true,
      labels: ['Système', 'Clair', 'Sombre'],
    });
  });

  it.each([
    { stored: null, checked: ['system'] },
    { stored: 'light', checked: ['light'] },
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
    { from: 'dark', choice: 'light' as const, stored: 'light', htmlDark: false },
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
