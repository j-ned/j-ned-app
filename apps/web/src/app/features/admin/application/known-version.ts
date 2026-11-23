import { linkedSignal, type Signal, type WritableSignal } from '@angular/core';

type Versioned = { readonly id: string; readonly version: number };

// Version la plus récente connue de l'onglet : celle de l'entité enregistrée ou relue, ou celle
// qu'une écriture annexe a rendue, la plus haute des deux quel que soit l'ordre des réponses.
export class KnownVersion {
  private readonly _value: WritableSignal<number>;
  readonly value: Signal<number>;

  constructor(saved: Signal<Versioned | null>) {
    this._value = linkedSignal<Versioned | null, number>({
      source: saved,
      computation: (current, previous) => {
        const sameEntity = current !== null && previous?.source?.id === current.id;
        return Math.max(current?.version ?? 0, sameEntity ? previous.value : 0);
      },
    });
    this.value = this._value.asReadonly();
  }

  adopt(version: number): void {
    this._value.update((known) => Math.max(known, version));
  }
}
