import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal, type Signal } from '@angular/core';

const DARK_CLASS = 'app-dark';

/**
 * Singleton qui expose un signal reactive du theme courant en observant
 * la classe `.app-dark` sur `<html>`. Les `computed()` qui dependent
 * du theme (couleurs lues via getComputedStyle, etc.) doivent lire
 * `isDark()` une fois pour creer la dependency.
 *
 * SSR-safe : sur le serveur, retourne `true` (mode dark par defaut)
 * sans observer.
 */
@Injectable({ providedIn: 'root' })
export class ThemeWatcher {
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _isDark = signal<boolean>(this._readInitial());
  readonly isDark: Signal<boolean> = this._isDark.asReadonly();

  constructor() {
    if (!this._isBrowser || typeof MutationObserver === 'undefined') return;
    const root = this._document.documentElement;
    const observer = new MutationObserver(() => {
      this._isDark.set(root.classList.contains(DARK_CLASS));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  private _readInitial(): boolean {
    if (!this._isBrowser) return true;
    return this._document.documentElement.classList.contains(DARK_CLASS);
  }
}
