import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal, type Signal } from '@angular/core';

const DARK_CLASS = 'app-dark';

/** Signal réactif du thème, dérivé de la classe `.app-dark` sur `<html>`. SSR-safe : `true` (dark) côté serveur, sans observer. */
@Injectable({ providedIn: 'root' })
export class ThemeWatcher {
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _isDark = signal<boolean>(this._readInitial());
  readonly isDark: Signal<boolean> = this._isDark.asReadonly();

  constructor() {
    if (!this._isBrowser || typeof MutationObserver === 'undefined') return;
    const root = this._document.documentElement;
    const observer = new MutationObserver(() => {
      this._isDark.set(root.classList.contains(DARK_CLASS));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    this._destroyRef.onDestroy(() => observer.disconnect());
  }

  private _readInitial(): boolean {
    if (!this._isBrowser) return true;
    return this._document.documentElement.classList.contains(DARK_CLASS);
  }
}
