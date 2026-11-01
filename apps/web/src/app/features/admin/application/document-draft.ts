import { computed, linkedSignal, signal, type Signal, type WritableSignal } from '@angular/core';
import { countChangedFields } from './count-draft-changes';
import { toFormTocEntries, type FormTocEntry, type FormTocSection } from './form-toc-entries';
import { LeaveConfirmation } from './leave-confirmation';

type DocumentSaveResult<TDocument> =
  | { readonly success: true; readonly data: TDocument }
  | { readonly success: false; readonly error: unknown };

export class DocumentDraft<TDocument, TDraft extends object> {
  private readonly _saved: WritableSignal<TDocument | null>;
  private readonly _saving = signal(false);
  private readonly baseline: WritableSignal<TDraft>;
  private readonly toDraft: (document: TDocument | null, previous?: TDraft) => TDraft;

  readonly saved: Signal<TDocument | null>;
  readonly value: WritableSignal<TDraft>;
  readonly saving = this._saving.asReadonly();
  readonly changes: Signal<number>;
  readonly toc: Signal<readonly FormTocEntry[]>;
  readonly leave = new LeaveConfirmation();

  constructor(options: {
    readonly loaded: () => TDocument | null;
    readonly toDraft: (document: TDocument | null, previous?: TDraft) => TDraft;
    readonly sections: readonly FormTocSection<TDraft>[];
  }) {
    const { loaded, toDraft, sections } = options;
    this.toDraft = toDraft;
    this._saved = linkedSignal(loaded);
    this.saved = this._saved.asReadonly();
    this.value = linkedSignal({
      source: loaded,
      computation: (document, previous) => toDraft(document, previous?.value),
    });
    this.baseline = linkedSignal({
      source: loaded,
      computation: (document, previous) => toDraft(document, previous?.value),
    });
    this.changes = computed(() => countChangedFields(this.value(), this.baseline()));
    this.toc = computed(() => toFormTocEntries(sections, this.value(), this.baseline()));
  }

  canLeave(): boolean | Promise<boolean> {
    return this.changes() === 0 || this.leave.ask();
  }

  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.changes() > 0) event.preventDefault();
  }

  async save(write: () => Promise<TDocument>): Promise<DocumentSaveResult<TDocument>> {
    this._saving.set(true);
    try {
      const saved = await write();
      this._saved.set(saved);
      const draft = this.toDraft(saved, this.value());
      this.value.set(draft);
      this.baseline.set(draft);
      return { success: true, data: saved };
    } catch (error: unknown) {
      return { success: false, error };
    } finally {
      this._saving.set(false);
    }
  }
}
