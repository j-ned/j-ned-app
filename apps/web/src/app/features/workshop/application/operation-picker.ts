import { Component, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import type { OperationFamily } from '../domain/models/operation.model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';

// Un seul name pour toutes les familles : un seul groupe de radios, que les flèches parcourent en entier.
@Component({
  selector: 'app-operation-picker',
  host: { class: 'block' },
  template: `
    <fieldset data-testid="operation-picker" class="grid gap-6 sm:grid-cols-2">
      <legend class="sr-only">{{ copy.operationLegend }}</legend>
      @for (family of families(); track family.id) {
        <fieldset data-testid="operation-family">
          <legend class="field-label">{{ family.label }}</legend>
          @for (operation of family.operations; track operation.id) {
            <label
              [for]="'operation-' + operation.slug"
              class="flex min-h-11 cursor-pointer items-center gap-3"
            >
              <input
                [id]="'operation-' + operation.slug"
                data-testid="operation-radio"
                type="radio"
                name="operation"
                class="size-4.5 accent-primary"
                [value]="operation.slug"
                [checked]="operation.slug === value()"
                (change)="value.set(operation.slug)"
              />
              {{ operation.label }}
            </label>
          }
        </fieldset>
      }
    </fieldset>
  `,
})
export class OperationPicker implements FormValueControl<string> {
  readonly families = input.required<readonly OperationFamily[]>();
  readonly value = model('');

  protected readonly copy = INSERT_GUIDE_COPY;
}
