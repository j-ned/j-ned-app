import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeStore } from './theme-store';
import type { ThemePreference } from './theme-preference';
import { installSystemColorScheme, type SystemColorScheme } from './testing/system-color-scheme';

const STORAGE_KEY = 'j-ned:theme';

type ThemeState = {
  readonly preference: ThemePreference;
  readonly isDark: boolean;
  readonly htmlDark: boolean;
  readonly stored: string | null;
};

describe('ThemeStore', () => {
  let scheme: SystemColorScheme | null = null;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  afterEach(() => {
    scheme?.restore();
    scheme = null;
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  function start(options: { stored: string | null; systemDark: boolean }): ThemeStore {
    scheme = installSystemColorScheme(options.systemDark);
    if (options.stored !== null) localStorage.setItem(STORAGE_KEY, options.stored);
    const store = TestBed.inject(ThemeStore);
    TestBed.tick();
    return store;
  }

  const stateOf = (store: ThemeStore): ThemeState => ({
    preference: store.preference(),
    isDark: store.isDark(),
    htmlDark: document.documentElement.classList.contains('app-dark'),
    stored: localStorage.getItem(STORAGE_KEY),
  });

  describe('au démarrage', () => {
    it.each<{ stored: string | null; systemDark: boolean; expected: ThemeState }>([
      {
        stored: 'dark',
        systemDark: false,
        expected: { preference: 'dark', isDark: true, htmlDark: true, stored: 'dark' },
      },
      {
        stored: 'light',
        systemDark: true,
        expected: { preference: 'light', isDark: false, htmlDark: false, stored: 'light' },
      },
      {
        stored: null,
        systemDark: true,
        expected: { preference: 'system', isDark: true, htmlDark: true, stored: null },
      },
      {
        stored: null,
        systemDark: false,
        expected: { preference: 'system', isDark: false, htmlDark: false, stored: null },
      },
      {
        stored: 'sepia',
        systemDark: true,
        expected: { preference: 'system', isDark: true, htmlDark: true, stored: 'sepia' },
      },
    ])(
      'Given the stored value $stored and a system dark scheme at $systemDark When the store starts Then the page follows it without writing anything',
      ({ stored, systemDark, expected }) => {
        expect(stateOf(start({ stored, systemDark }))).toEqual(expected);
      },
    );
  });

  describe('choix explicite', () => {
    it.each<{ choice: ThemePreference; expected: ThemeState }>([
      {
        choice: 'dark',
        expected: { preference: 'dark', isDark: true, htmlDark: true, stored: 'dark' },
      },
      {
        choice: 'light',
        expected: { preference: 'light', isDark: false, htmlDark: false, stored: 'light' },
      },
      {
        choice: 'system',
        expected: { preference: 'system', isDark: true, htmlDark: true, stored: null },
      },
    ])(
      'Given a stored light preference and a dark system When $choice is chosen Then the page and the storage follow',
      ({ choice, expected }) => {
        const store = start({ stored: 'light', systemDark: true });

        store.setPreference(choice);
        TestBed.tick();

        expect(stateOf(store)).toEqual(expected);
      },
    );

    it('Given the system preference in use When the page is toggled twice Then it is stored as light, then as dark', () => {
      const store = start({ stored: null, systemDark: true });

      store.toggle();
      TestBed.tick();
      const afterFirst = stateOf(store);
      store.toggle();
      TestBed.tick();

      expect({ afterFirst, afterSecond: stateOf(store) }).toEqual({
        afterFirst: { preference: 'light', isDark: false, htmlDark: false, stored: 'light' },
        afterSecond: { preference: 'dark', isDark: true, htmlDark: true, stored: 'dark' },
      });
    });
  });

  describe('préférence du système', () => {
    it('Given the system preference in use When the system switches to dark Then the page follows without storing anything', () => {
      const store = start({ stored: null, systemDark: false });

      scheme?.set(true);
      TestBed.tick();

      expect(stateOf(store)).toEqual({
        preference: 'system',
        isDark: true,
        htmlDark: true,
        stored: null,
      });
    });

    it('Given an explicit light preference When the system switches to dark Then the page stays light', () => {
      const store = start({ stored: 'light', systemDark: false });

      scheme?.set(true);
      TestBed.tick();

      expect(stateOf(store)).toEqual({
        preference: 'light',
        isDark: false,
        htmlDark: false,
        stored: 'light',
      });
    });
  });

  describe('rendu serveur', () => {
    it('Given a stored light preference When the store runs on the server Then it resolves to dark and leaves the document alone', () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      const store = start({ stored: 'light', systemDark: false });

      expect({
        isDark: store.isDark(),
        htmlDark: document.documentElement.classList.contains('app-dark'),
      }).toEqual({ isDark: true, htmlDark: false });
    });
  });
});
