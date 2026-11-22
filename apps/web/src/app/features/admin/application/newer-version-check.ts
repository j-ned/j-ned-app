import {
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { LeaveConfirmation } from './leave-confirmation';
import { refreshAdminWhenVisible } from './refresh-admin-when-visible';

type Version = string | number;
export type EditedVersion = { readonly id: string; readonly version: Version };

const sameEdited = (a: EditedVersion | null, b: EditedVersion | null): boolean =>
  a === b || (a !== null && b !== null && a.id === b.id && a.version === b.version);

export const editedVersion = (
  entity: { readonly id: string; readonly updatedAt: string } | null,
): EditedVersion | null => (entity ? { id: entity.id, version: entity.updatedAt } : null);

// Compare des versions (`updatedAt`, `version`), jamais le contenu : le brouillon n'est pas relu.
export class NewerVersionCheck {
  private readonly destroyRef = inject(DestroyRef);
  private readonly edited: Signal<EditedVersion | null>;
  private readonly _detected: WritableSignal<boolean>;
  private readonly reloadedFrom = signal<EditedVersion | null>(null);

  readonly detected: Signal<boolean>;
  readonly reloaded: Signal<boolean>;
  readonly overwrite = new LeaveConfirmation();

  constructor(
    private readonly options: {
      readonly edited: () => EditedVersion | null;
      readonly readLatest: (id: string) => Observable<Version | null>;
      readonly reload: () => void;
      readonly paused: () => boolean;
      readonly dirty: () => boolean;
      readonly staleRejectedByApi?: boolean;
    },
  ) {
    this.edited = computed(options.edited, { equal: sameEdited });
    this._detected = linkedSignal({ source: this.edited, computation: () => false });
    this.detected = this._detected.asReadonly();
    // Vrai seulement si la version éditée a changé depuis celle d'où le rechargement est parti ;
    // retombe à la saisie suivante et au prochain changement de version.
    this.reloaded = linkedSignal<
      {
        readonly edited: EditedVersion | null;
        readonly dirty: boolean;
        readonly reloadedFrom: EditedVersion | null;
      },
      boolean
    >({
      source: () => ({
        edited: this.edited(),
        dirty: options.dirty(),
        reloadedFrom: this.reloadedFrom(),
      }),
      computation: (source, previous) => {
        if (!previous || source.dirty) return false;
        if (source.edited === previous.source.edited) return previous.value;
        return sameEdited(source.reloadedFrom, previous.source.edited);
      },
    });
    refreshAdminWhenVisible(() => this.check());
  }

  // L'API a refusé une version périmée : inutile de relire pour le savoir.
  reportConflict(): void {
    this._detected.set(true);
  }

  reload(): void {
    this.reloadedFrom.set(this.edited());
    this.options.reload();
  }

  // Sans contrôle de version côté API, enregistrer remplacerait l'autre version sans le dire.
  beforeSave(): boolean | Promise<boolean> {
    this.reloadedFrom.set(null);
    if (this.options.staleRejectedByApi || !this._detected()) return true;
    return this.overwrite.ask();
  }

  private check(): void {
    const { readLatest, paused } = this.options;
    const edited = this.edited();
    if (edited === null || paused() || this._detected()) return;
    readLatest(edited.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (latest) => {
          if (latest === null || paused() || !sameEdited(this.edited(), edited)) return;
          if (latest !== edited.version) this._detected.set(true);
        },
        // Relecture de fond : un échec laisse l'éditeur tel quel, le prochain retour réessaie.
        error: () => undefined,
      });
  }
}
