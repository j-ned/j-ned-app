import { Component, computed, input, output } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { MACHINING_OPERATIONS } from '@features/workshop/domain/machining-operations.static-data';
import { findConfidentialReferences } from '@features/workshop/domain/confidential-references';
import { textAfterInsertCode } from '@features/workshop/domain/decode-insert-code';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { SuggestInput } from '@shared/ui/suggest-input';
import type { InsertGuideToolDraft } from '../insert-guide-draft';

@Component({
  selector: 'div[app-admin-insert-guide-tool]',
  imports: [FormField, AppIcon, Button, FieldError, SuggestInput],
  host: {
    role: 'group',
    'data-testid': 'admin-insert-guide-tool',
    '[attr.aria-label]': "'Outil ' + rank() + ', ' + owner()",
    class: 'tool-row-grid items-start gap-y-2 border-t border-line pt-3 lg:gap-y-0',
  },
  template: `
    @let tool = entry();
    @let id = idPrefix();
    @let name = ' (outil ' + rank() + ', ' + owner() + ')';

    <div class="col-span-2 min-w-0 lg:col-span-1">
      @let operationError = tool.operation().touched() && tool.operation().invalid();
      <label [for]="id + '-operation'" class="block text-xs text-muted"
        ><span class="lg:sr-only">Opération</span><span class="sr-only">{{ name }}</span></label
      >
      <select
        [id]="id + '-operation'"
        data-testid="admin-insert-guide-operation"
        [formField]="tool.operation"
        aria-required="true"
        [attr.aria-invalid]="operationError"
        [attr.aria-describedby]="operationError ? id + '-operation-error' : null"
        class="app-select w-full"
      >
        <option value="" disabled>Choisir une opération</option>
        @for (operation of operations; track operation.id) {
          <option [value]="operation.id">{{ operation.label }}</option>
        }
      </select>
      <app-field-error
        [field]="tool.operation"
        [errorId]="id + '-operation-error'"
        testId="admin-insert-guide-operation-error"
      />
    </div>

    <div class="col-span-2 min-w-0 lg:col-span-1">
      @let insertError = tool.insert().touched() && tool.insert().invalid();
      <label [for]="id + '-insert'" class="block text-xs text-muted"
        ><span class="lg:sr-only">Plaquette</span><span class="sr-only">{{ name }}</span></label
      >
      <app-suggest-input
        [inputId]="id + '-insert'"
        inputTestId="admin-insert-guide-insert"
        [formField]="tool.insert"
        [suggestions]="insertSuggestions()"
        listLabel="Plaquettes déjà saisies"
        [mandatory]="true"
        [markedInvalid]="insertError"
        [describedBy]="insertError ? id + '-insert-error' : null"
      />
      <app-field-error
        [field]="tool.insert"
        [errorId]="id + '-insert-error'"
        testId="admin-insert-guide-insert-error"
      />
    </div>

    <div class="min-w-0">
      @let radiusError = tool.noseRadius().touched() && tool.noseRadius().invalid();
      <label [for]="id + '-radius'" class="block text-xs text-muted"
        ><span class="lg:sr-only">Rayon</span
        ><span class="sr-only"> de bec en mm{{ name }}</span></label
      >
      <input
        type="number"
        step="0.01"
        inputmode="decimal"
        [id]="id + '-radius'"
        data-testid="admin-insert-guide-radius"
        [formField]="tool.noseRadius"
        [attr.aria-invalid]="radiusError"
        [attr.aria-describedby]="
          radiusError ? radiusHintId() + ' ' + id + '-radius-error' : radiusHintId()
        "
        class="form-input"
      />
      <app-field-error
        [field]="tool.noseRadius"
        [errorId]="id + '-radius-error'"
        testId="admin-insert-guide-radius-error"
      />
    </div>

    <div class="col-span-2 min-w-0 lg:col-span-1">
      @let noteError = tool.note().touched() && tool.note().invalid();
      <label [for]="id + '-note'" class="block text-xs text-muted"
        ><span class="lg:sr-only">Remarque</span><span class="sr-only">{{ name }}</span></label
      >
      <input
        type="text"
        [id]="id + '-note'"
        data-testid="admin-insert-guide-note"
        [formField]="tool.note"
        [attr.aria-invalid]="noteError"
        [attr.aria-describedby]="noteError ? id + '-note-error' : null"
        class="form-input"
      />
      <app-field-error
        [field]="tool.note"
        [errorId]="id + '-note-error'"
        testId="admin-insert-guide-note-error"
      />
    </div>

    <div class="flex justify-end self-end lg:self-start">
      <button
        appButton
        type="button"
        variant="text-danger"
        size="icon"
        data-testid="admin-insert-guide-remove"
        (click)="removed.emit()"
      >
        <app-icon name="trash" [size]="16" /><span class="sr-only">{{ removeLabel() }}</span>
      </button>
    </div>

    @if (references(); as found) {
      <p
        data-testid="admin-insert-guide-confidential"
        class="col-span-4 rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-sm lg:col-span-5 lg:mt-2"
      >
        Référence repérée&nbsp;: «&nbsp;{{ found }}&nbsp;». Vérifiez qu'elle ne désigne ni une
        pièce, ni un plan, ni un ordre de fabrication.
      </p>
    }
  `,
})
export class AdminInsertGuideTool {
  readonly entry = input.required<FieldTree<InsertGuideToolDraft>>();
  readonly rank = input.required<number>();
  readonly owner = input.required<string>();
  readonly idPrefix = input.required<string>();
  readonly radiusHintId = input.required<string>();
  readonly insertSuggestions = input.required<readonly string[]>();
  readonly removed = output<void>();

  protected readonly operations = MACHINING_OPERATIONS;
  protected readonly removeLabel = computed(
    () => `Retirer l'outil ${this.rank()} (${this.owner()})`,
  );

  protected readonly references = computed(() => {
    const { insert, note } = this.entry()().value();
    // Les chiffres d'un code ISO décodable sont des tailles : seul ce qui le suit est analysé.
    const checkedInsert = textAfterInsertCode(insert) ?? insert;
    return findConfidentialReferences([checkedInsert, note].join('\n')).join(', ');
  });
}
