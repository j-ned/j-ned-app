import { Component, computed, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { FieldError } from '@shared/ui/field-error';
import { RequiredMark } from './required-mark';

@Component({
  selector: 'app-admin-profile-text-field',
  imports: [FormField, FieldError, RequiredMark],
  host: { class: 'block' },
  template: `
    @let inError = field()().touched() && field()().invalid();
    @let describedBy = [hint() ? hintId() : '', inError ? errorId() : ''].join(' ').trim();
    <label [for]="id()" class="field-label">
      {{ label() }}
      @if (rank() === null) {
        <app-required-mark />
      }
    </label>
    @if (rows(); as lines) {
      <textarea
        [id]="id()"
        [attr.data-testid]="testId()"
        [formField]="field()"
        aria-required="true"
        [attr.aria-invalid]="inError"
        [attr.aria-describedby]="describedBy || null"
        [rows]="lines"
        class="form-textarea min-h-0"
      ></textarea>
    } @else {
      <input
        type="text"
        [id]="id()"
        [attr.data-testid]="testId()"
        [formField]="field()"
        aria-required="true"
        [attr.aria-invalid]="inError"
        [attr.aria-describedby]="describedBy || null"
        class="form-input"
      />
    }
    @if (hint(); as text) {
      <p [id]="hintId()" class="field-hint">{{ text }}</p>
    }
    <app-field-error [field]="field()" [errorId]="errorId()" [testId]="testId() + '-error'" />
  `,
})
export class AdminProfileTextField {
  readonly field = input.required<FieldTree<string>>();
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly rows = input<number | null>(null);
  // Tous les champs d'une ligne de liste sont obligatoires : leur libellé porte le rang, pas la mention.
  readonly rank = input<number | null>(null);
  readonly hint = input('');

  protected readonly id = computed(() => {
    const rank = this.rank();
    return rank === null ? `profile-${this.key()}` : `profile-${this.key()}-${rank}`;
  });
  protected readonly errorId = computed(() => `${this.id()}-error`);
  protected readonly hintId = computed(() => `${this.id()}-hint`);
  protected readonly testId = computed(() => `admin-profile-${this.key()}`);
}
