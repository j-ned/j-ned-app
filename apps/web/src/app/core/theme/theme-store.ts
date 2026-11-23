import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { parseThemePreference, resolveIsDark, type ThemePreference } from './theme-preference';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';
import {
  injectStorageHost,
  readStored,
  removeStored,
  writeStored,
} from '@core/storage/browser-storage';

// Clé, valeurs et règle dupliquées dans le script de pré-peinture d'index.html : les garder alignées.
const STORAGE_KEY = 'j-ned:theme';
const DARK_CLASS = 'app-dark';
const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _document = inject(DOCUMENT);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _isBrowser = injectIsBrowser();
  private readonly _storage = injectStorageHost();

  private readonly _preference = signal<ThemePreference>(this._readStoredPreference());
  private readonly _systemPrefersDark = signal(this._watchSystemPreference());

  readonly preference = this._preference.asReadonly();
  readonly isDark = computed(
    () => !this._isBrowser || resolveIsDark(this._preference(), this._systemPrefersDark()),
  );

  private readonly _applyClassEffect = effect(() => {
    const isDark = this.isDark();
    if (this._isBrowser) this._document.documentElement.classList.toggle(DARK_CLASS, isDark);
  });

  constructor() {
    this._destroyRef.onDestroy(() => this._applyClassEffect.destroy());
  }

  setPreference(preference: ThemePreference): void {
    this._preference.set(preference);
    this._writeStoredPreference(preference);
  }

  toggle(): void {
    this.setPreference(this.isDark() ? 'light' : 'dark');
  }

  private _readStoredPreference(): ThemePreference {
    return parseThemePreference(readStored(this._storage, 'localStorage', STORAGE_KEY));
  }

  private _writeStoredPreference(preference: ThemePreference): void {
    // Stockage bloqué : la préférence vaut pour la session seulement.
    if (preference === 'system') removeStored(this._storage, 'localStorage', STORAGE_KEY);
    else writeStored(this._storage, 'localStorage', STORAGE_KEY, preference);
  }

  private _watchSystemPreference(): boolean {
    const media = this._isBrowser ? this._document.defaultView?.matchMedia?.(DARK_QUERY) : null;
    if (!media) return false;
    const follow = (event: MediaQueryListEvent): void => this._systemPrefersDark.set(event.matches);
    media.addEventListener('change', follow);
    this._destroyRef.onDestroy(() => media.removeEventListener('change', follow));
    return media.matches;
  }
}
