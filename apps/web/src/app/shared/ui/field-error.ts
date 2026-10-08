import { Component, input } from '@angular/core';
import type { ReadonlyFieldTree } from '@angular/forms/signals';

@Component({
  selector: 'app-field-error',
  host: { class: 'contents' },
  template: `
    @let state = field()();
    @if (state.touched() && state.invalid()) {
      <p [id]="errorId()" [attr.data-testid]="testId() ?? null" role="alert" class="form-error">
        {{ state.errors()[0]?.message }}
      </p>
    }
  `,
})
export class FieldError {
  readonly field = input.required<ReadonlyFieldTree<unknown>>();
  readonly errorId = input.required<string>();
  readonly testId = input<string>();
}
