import { Injectable, signal } from '@angular/core';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';

export const DEVICE_EXCLUSION_STORAGE_KEY = 'analytics:exclude-device';

// Persiste après déconnexion : l'admin qui consulte son propre site ne compte pas comme un visiteur.
@Injectable({ providedIn: 'root' })
export class AnalyticsDeviceExclusion {
  private readonly isBrowser = injectIsBrowser();
  private readonly _excluded = signal(this.readStored());

  readonly excluded = this._excluded.asReadonly();

  toggle(): void {
    const next = !this._excluded();
    this._excluded.set(next);
    if (!this.isBrowser) return;
    try {
      if (next) {
        localStorage.setItem(DEVICE_EXCLUSION_STORAGE_KEY, '1');
      } else {
        localStorage.removeItem(DEVICE_EXCLUSION_STORAGE_KEY);
      }
    } catch {
      // Stockage indisponible (navigation privée, quota) : l'état reste valable pour la session.
    }
  }

  private readStored(): boolean {
    if (!this.isBrowser) return false;
    try {
      return localStorage.getItem(DEVICE_EXCLUSION_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
