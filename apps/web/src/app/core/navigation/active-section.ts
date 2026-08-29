import { Injectable, signal, type Signal } from '@angular/core';

// Alimentée par SectionVisibility (scroll-spy), lue par le header pour l'indicateur de nav.
@Injectable({ providedIn: 'root' })
export class ActiveSection {
  private readonly _key = signal<string | null>(null);
  readonly key: Signal<string | null> = this._key.asReadonly();

  set(key: string): void {
    this._key.set(key);
  }

  /** Réinitialise uniquement si la section sortante est encore l'active courante. */
  clear(key: string): void {
    if (this._key() === key) {
      this._key.set(null);
    }
  }
}
