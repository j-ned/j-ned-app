import { Component, computed, input, output } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { MACHINING_OPERATIONS } from '@features/workshop/domain/machining-operations.static-data';
import { findConfidentialReferences } from '@features/workshop/domain/confidential-references';
import { textAfterInsertCode } from '@features/workshop/domain/decode-insert-code';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { SuggestInput } from '@shared/ui/suggest-input';
import type { InsertGuideRowDraft } from '../insert-guide-draft';

@Component({
  selector: 'fieldset[app-admin-insert-guide-row]',
  imports: [FormField, AppIcon, Button, FieldError, SuggestInput],
  host: {
    'data-testid': 'admin-insert-guide-row',
    class:
      'grid min-w-0 gap-3 rounded-md border border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_minmax(0,11rem)_8rem]',
  },
  template: `
    @let row = entry();
    @let id = 'insert-guide-' + rank();
    <legend class="px-1 font-display text-sm font-bold">Ligne {{ rank() }}</legend>

    <div class="min-w-0">
      @let materialError = row.material().touched() && row.material().invalid();
      <label [for]="id + '-material'" class="field-label">Matière</label>
      <app-suggest-input
        [inputId]="id + '-material'"
        inputTestId="admin-insert-guide-material"
        [formField]="row.material"
        [suggestions]="materialSuggestions()"
        listLabel="Matières déjà saisies"
        [mandatory]="true"
        [markedInvalid]="materialError"
        [describedBy]="materialError ? id + '-material-error' : null"
      />
      <app-field-error
        [field]="row.material"
        [errorId]="id + '-material-error'"
        testId="admin-insert-guide-material-error"
      />
    </div>

    <div class="min-w-0">
      @let operationError = row.operation().touched() && row.operation().invalid();
      <label [for]="id + '-operation'" class="field-label">Opération</label>
      <select
        [id]="id + '-operation'"
        data-testid="admin-insert-guide-operation"
        [formField]="row.operation"
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
        [field]="row.operation"
        [errorId]="id + '-operation-error'"
        testId="admin-insert-guide-operation-error"
      />
    </div>

    <div class="min-w-0">
      @let insertError = row.insert().touched() && row.insert().invalid();
      <label [for]="id + '-insert'" class="field-label">Plaquette</label>
      <app-suggest-input
        [inputId]="id + '-insert'"
        inputTestId="admin-insert-guide-insert"
        [formField]="row.insert"
        [suggestions]="insertSuggestions()"
        listLabel="Plaquettes déjà saisies"
        [mandatory]="true"
        [markedInvalid]="insertError"
        [describedBy]="insertError ? id + '-insert-error' : null"
      />
      <app-field-error
        [field]="row.insert"
        [errorId]="id + '-insert-error'"
        testId="admin-insert-guide-insert-error"
      />
    </div>

    <div class="min-w-0">
      @let radiusError = row.noseRadius().touched() && row.noseRadius().invalid();
      <label [for]="id + '-radius'" class="field-label">Rayon de bec (mm)</label>
      <input
        type="number"
        step="0.01"
        inputmode="decimal"
        [id]="id + '-radius'"
        data-testid="admin-insert-guide-radius"
        [formField]="row.noseRadius"
        aria-required="true"
        [attr.aria-invalid]="radiusError"
        [attr.aria-describedby]="radiusError ? id + '-radius-error' : null"
        class="form-input"
      />
      <app-field-error
        [field]="row.noseRadius"
        [errorId]="id + '-radius-error'"
        testId="admin-insert-guide-radius-error"
      />
    </div>

    <div class="min-w-0 sm:col-span-2 lg:col-span-3">
      @let noteError = row.note().touched() && row.note().invalid();
      <label [for]="id + '-note'" class="field-label">Remarque (facultative)</label>
      <input
        type="text"
        [id]="id + '-note'"
        data-testid="admin-insert-guide-note"
        [formField]="row.note"
        [attr.aria-invalid]="noteError"
        [attr.aria-describedby]="noteError ? id + '-note-error' : null"
        class="form-input"
      />
      <app-field-error
        [field]="row.note"
        [errorId]="id + '-note-error'"
        testId="admin-insert-guide-note-error"
      />
    </div>

    <div class="flex items-end sm:col-span-2 lg:col-span-1 lg:justify-end">
      <button
        appButton
        type="button"
        variant="text-danger"
        data-testid="admin-insert-guide-remove"
        [attr.aria-label]="'Retirer la ligne ' + rank()"
        (click)="removed.emit()"
      >
        <app-icon name="trash" [size]="16" />Retirer
      </button>
    </div>

    @if (references(); as found) {
      <p
        data-testid="admin-insert-guide-confidential"
        class="rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-sm sm:col-span-2 lg:col-span-4"
      >
        Référence repérée&nbsp;: «&nbsp;{{ found }}&nbsp;». Vérifiez qu'elle ne désigne ni une
        pièce, ni un plan, ni un ordre de fabrication.
      </p>
    }
  `,
})
export class AdminInsertGuideRow {
  readonly entry = input.required<FieldTree<InsertGuideRowDraft>>();
  readonly rank = input.required<number>();
  readonly materialSuggestions = input.required<readonly string[]>();
  readonly insertSuggestions = input.required<readonly string[]>();
  readonly removed = output<void>();

  protected readonly operations = MACHINING_OPERATIONS;

  protected readonly references = computed(() => {
    const { material, insert, note } = this.entry()().value();
    // Les chiffres d'un code ISO décodable sont des tailles : seul ce qui le suit est analysé.
    const checkedInsert = textAfterInsertCode(insert) ?? insert;
    return findConfidentialReferences([material, checkedInsert, note].join('\n')).join(', ');
  });
}
