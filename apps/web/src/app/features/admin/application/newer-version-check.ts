import { DestroyRef, inject, linkedSignal, type Signal, type WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { refreshAdminWhenVisible } from './refresh-admin-when-visible';

type Version = string | number;

// Compare des versions (`updatedAt`, `version`), jamais le contenu : le brouillon n'est pas relu.
export class NewerVersionCheck {
  private readonly destroyRef = inject(DestroyRef);
  private readonly _detected: WritableSignal<boolean>;

  readonly detected: Signal<boolean>;

  constructor(
    private readonly options: {
      readonly current: () => Version | null;
      readonly readLatest: () => Observable<Version | null>;
      readonly paused: () => boolean;
    },
  ) {
    this._detected = linkedSignal({ source: options.current, computation: () => false });
    this.detected = this._detected.asReadonly();
    refreshAdminWhenVisible(() => this.check());
  }

  private check(): void {
    const { current, readLatest, paused } = this.options;
    const edited = current();
    if (edited === null || paused()) return;
    readLatest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (latest) => {
          if (latest === null || paused() || current() !== edited) return;
          if (latest !== edited) this._detected.set(true);
        },
        // Relecture de fond : un échec laisse l'éditeur tel quel, le prochain retour réessaie.
        error: () => undefined,
      });
  }
}
