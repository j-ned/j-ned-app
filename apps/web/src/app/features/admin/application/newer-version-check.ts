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
import { catchError, firstValueFrom, of, type Observable } from 'rxjs';
import { LeaveConfirmation } from './leave-confirmation';
import { refreshAdminWhenVisible } from './refresh-admin-when-visible';

export type EditedVersion = { readonly id: string; readonly version: number };

// `version` : celle à envoyer en `If-Match`, `null` pour une entité jamais enregistrée.
export type SaveDecision =
  { readonly proceed: false } | { readonly proceed: true; readonly version: number | null };

const sameEdited = (a: EditedVersion | null, b: EditedVersion | null): boolean =>
  a === b || (a !== null && b !== null && a.id === b.id && a.version === b.version);

export const editedVersion = (
  entity: { readonly id: string; readonly version: number } | null,
): EditedVersion | null => (entity ? { id: entity.id, version: entity.version } : null);

// Compare des versions, jamais le contenu : le brouillon n'est pas relu.
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
      readonly readLatest: (id: string) => Observable<number | null>;
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
        // Sans rechargement demandé, `null` égale le `null` d'avant le premier chargement.
        return (
          source.reloadedFrom !== null && sameEdited(source.reloadedFrom, previous.source.edited)
        );
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

  // Version plus récente signalée : enregistrer par-dessus se confirme, puis part avec la version
  // relue à cet instant, jamais sans condition.
  async beforeSave(): Promise<SaveDecision> {
    this.reloadedFrom.set(null);
    const edited = this.edited();
    if (edited === null) return { proceed: true, version: null };
    if (this.options.staleRejectedByApi || !this._detected()) {
      return { proceed: true, version: edited.version };
    }
    if (!(await this.overwrite.ask())) return { proceed: false };
    return { proceed: true, version: await this.latestVersion(edited) };
  }

  // Relecture impossible : la version éditée part, l'API la refuse en 409 et l'avertissement reste.
  private async latestVersion(edited: EditedVersion): Promise<number> {
    const latest = await firstValueFrom(
      this.options.readLatest(edited.id).pipe(catchError(() => of(null))),
      { defaultValue: null },
    );
    return latest ?? edited.version;
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
