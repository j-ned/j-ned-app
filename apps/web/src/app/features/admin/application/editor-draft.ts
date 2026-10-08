import { computed, linkedSignal, signal, type Signal, type WritableSignal } from '@angular/core';
import { countChangedFields } from './count-draft-changes';
import { toFormTocEntries, type FormTocEntry, type FormTocSection } from './form-toc-entries';
import { LeaveConfirmation } from './leave-confirmation';

type EditorEntity = { readonly id: string; readonly tags: readonly string[] };

export type EditedDraft<TDraft> = TDraft & {
  readonly tags: ReadonlySet<string>;
  readonly cover: File | null;
};

type CoverUpload =
  | { readonly status: 'none' }
  | { readonly status: 'sent' }
  | { readonly status: 'failed'; readonly error: unknown };

type SaveResult<TEntity> =
  | {
      readonly success: true;
      readonly data: { readonly saved: TEntity; readonly cover: CoverUpload };
    }
  | { readonly success: false; readonly error: unknown };

export class EditorDraft<TEntity extends EditorEntity, TDraft extends object> {
  private readonly _saved: WritableSignal<TEntity | null>;
  private readonly _pendingCover = signal<File | null>(null);
  private readonly _coverResetToken = signal(0);
  private readonly _saving = signal(false);
  private readonly baseline: WritableSignal<EditedDraft<TDraft>>;
  private readonly edited: Signal<EditedDraft<TDraft>>;

  readonly saved: Signal<TEntity | null>;
  readonly value: WritableSignal<TDraft>;
  readonly tags: WritableSignal<ReadonlySet<string>>;
  readonly pendingCover = this._pendingCover.asReadonly();
  readonly coverResetToken = this._coverResetToken.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly changes: Signal<number>;
  readonly toc: Signal<readonly FormTocEntry[]>;
  readonly leave = new LeaveConfirmation();

  constructor(options: {
    readonly loaded: () => TEntity | null;
    readonly toDraft: (entity: TEntity | null) => TDraft;
    readonly sections: readonly FormTocSection<EditedDraft<TDraft>>[];
  }) {
    const { loaded, toDraft, sections } = options;
    this._saved = linkedSignal(loaded);
    this.saved = this._saved.asReadonly();
    this.value = linkedSignal(() => toDraft(loaded()));
    this.tags = linkedSignal<ReadonlySet<string>>(() => new Set(loaded()?.tags ?? []));
    this.baseline = linkedSignal<EditedDraft<TDraft>>(() => ({
      ...toDraft(loaded()),
      tags: new Set(loaded()?.tags ?? []),
      cover: null,
    }));
    this.edited = computed<EditedDraft<TDraft>>(() => ({
      ...this.value(),
      tags: this.tags(),
      cover: this._pendingCover(),
    }));
    this.changes = computed(() => countChangedFields(this.edited(), this.baseline()));
    this.toc = computed(() => toFormTocEntries(sections, this.edited(), this.baseline()));
  }

  selectCover(file: File): void {
    this._pendingCover.set(file);
  }

  clearCover(): void {
    this._pendingCover.set(null);
  }

  rejectCover(): void {
    this._pendingCover.set(null);
    this._coverResetToken.update((token) => token + 1);
  }

  canLeave(): boolean | Promise<boolean> {
    return this.changes() === 0 || this.leave.ask();
  }

  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.changes() > 0) event.preventDefault();
  }

  // Une couverture refusée après l'écriture laisse l'entité enregistrée.
  async save(
    write: () => Promise<TEntity>,
    uploadCover: (cover: File, id: string) => Promise<unknown>,
  ): Promise<SaveResult<TEntity>> {
    this._saving.set(true);
    try {
      let saved: TEntity;
      try {
        saved = await write();
      } catch (error: unknown) {
        return { success: false, error };
      }
      const cover = await this.sendCover(saved.id, uploadCover);
      this.markSaved(saved);
      return { success: true, data: { saved, cover } };
    } finally {
      this._saving.set(false);
    }
  }

  private async sendCover(
    id: string,
    uploadCover: (cover: File, id: string) => Promise<unknown>,
  ): Promise<CoverUpload> {
    const cover = this._pendingCover();
    if (!cover) return { status: 'none' };
    try {
      await uploadCover(cover, id);
      return { status: 'sent' };
    } catch (error: unknown) {
      return { status: 'failed', error };
    }
  }

  private markSaved(saved: TEntity): void {
    this._saved.set(saved);
    this._pendingCover.set(null);
    this._coverResetToken.update((token) => token + 1);
    this.baseline.set(this.edited());
  }
}
