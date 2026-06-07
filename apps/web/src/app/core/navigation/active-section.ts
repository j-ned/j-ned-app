import { Injectable, signal, type Signal } from '@angular/core';

/**
 * Source de vérité réactive de la section "active" pour l'indicateur de
 * navigation. Alimentée par la directive SectionVisibility (scroll-spy) côté
 * contenu, lue par le header pour afficher la barre d'état sous le lien actif.
 */
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
