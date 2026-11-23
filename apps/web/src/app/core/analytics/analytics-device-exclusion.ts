import { Injectable, signal } from '@angular/core';
import {
  injectStorageHost,
  readStored,
  removeStored,
  writeStored,
} from '@core/storage/browser-storage';

export const DEVICE_EXCLUSION_STORAGE_KEY = 'analytics:exclude-device';

// Persiste après déconnexion : l'admin qui consulte son propre site ne compte pas comme un visiteur.
@Injectable({ providedIn: 'root' })
export class AnalyticsDeviceExclusion {
  private readonly storage = injectStorageHost();
  private readonly _excluded = signal(this.readStored());

  readonly excluded = this._excluded.asReadonly();

  toggle(): void {
    const next = !this._excluded();
    this._excluded.set(next);
    // Stockage indisponible (navigation privée, quota) : l'état reste valable pour la session.
    if (next) writeStored(this.storage, 'localStorage', DEVICE_EXCLUSION_STORAGE_KEY, '1');
    else removeStored(this.storage, 'localStorage', DEVICE_EXCLUSION_STORAGE_KEY);
  }

  private readStored(): boolean {
    return readStored(this.storage, 'localStorage', DEVICE_EXCLUSION_STORAGE_KEY) === '1';
  }
}
