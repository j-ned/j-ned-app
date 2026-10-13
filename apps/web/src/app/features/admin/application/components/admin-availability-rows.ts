import { Component, computed, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import {
  toTimeOfDay,
  type AvailabilityRangeRow,
  type AvailabilityWeekday,
} from '../availability-draft';

const STEP_MINUTES = 30;
const MINUTES_PER_DAY = 1440;

const HALF_HOURS = Array.from({ length: MINUTES_PER_DAY / STEP_MINUTES + 1 }, (_, index) =>
  toTimeOfDay(index * STEP_MINUTES),
);
const START_TIMES = HALF_HOURS.slice(0, -1);
const END_TIMES = HALF_HOURS.slice(1);

@Component({
  selector: 'fieldset[app-admin-availability-rows]',
  imports: [FormField, AppIcon, Button, FieldError],
  host: { 'data-testid': 'admin-availability-day', class: 'block min-w-0' },
  template: `
    @let weekday = day();
    <legend class="mb-2 font-display text-base font-bold font-stretch-104%">
      {{ weekday.label }}
    </legend>
    <div class="border-t border-line">
      @for (line of lines(); track line.row; let rowIndex = $index) {
        @let rank = rowIndex + 1;
        <div
          data-testid="admin-availability-rule"
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-start gap-2.5 border-b border-line py-2.5"
        >
          @for (cell of line.cells; track cell.part) {
            @let id = 'availability-' + weekday.key + '-' + rank + '-' + cell.part;
            @let errorId = id + '-error';
            @let inError = cell.field().touched() && cell.field().invalid();
            <div class="min-w-0">
              <label [for]="id" class="field-label"
                >{{ cell.label
                }}<span class="sr-only"> de la plage {{ rank }} du {{ dayName() }}</span></label
              >
              <select
                [id]="id"
                [attr.data-testid]="'admin-availability-rule-' + cell.part"
                [formField]="cell.field"
                aria-required="true"
                [attr.aria-invalid]="inError"
                [attr.aria-describedby]="inError ? errorId : null"
                class="app-select w-full font-mono tabular-nums"
              >
                <option value="" disabled>--:--</option>
                @for (time of cell.times; track time) {
                  <option [value]="time">{{ time }}</option>
                }
              </select>
              <app-field-error
                [field]="cell.field"
                [errorId]="errorId"
                [testId]="'admin-availability-rule-' + cell.part + '-error'"
              />
            </div>
          }
          <button
            appButton
            type="button"
            variant="text-danger"
            size="icon"
            data-testid="admin-availability-rule-remove"
            class="mt-6.5"
            [attr.aria-label]="'Retirer la plage ' + rank + ' du ' + dayName()"
            (click)="removeRange(rowIndex)"
          >
            <app-icon name="trash" [size]="18" />
          </button>
        </div>
      } @empty {
        <p data-testid="admin-availability-day-empty" class="py-3 text-sm text-muted">
          Aucun créneau ce jour-là
        </p>
      }
    </div>
    <button
      appButton
      type="button"
      variant="text"
      data-testid="admin-availability-rule-add"
      class="mt-1.5"
      (click)="addRange()"
    >
      <app-icon name="plus" [size]="16" />Ajouter une plage<span class="sr-only">
        le {{ dayName() }}</span
      >
    </button>
  `,
})
export class AdminAvailabilityRows {
  readonly rows = input.required<FieldTree<AvailabilityRangeRow[]>>();
  readonly day = input.required<AvailabilityWeekday>();

  protected readonly dayName = computed(() => this.day().label.toLowerCase());

  protected readonly lines = computed(() =>
    Array.from(this.rows(), (row) => ({
      row,
      cells: [
        { part: 'start', label: 'Début', field: row.start, times: START_TIMES },
        { part: 'end', label: 'Fin', field: row.end, times: END_TIMES },
      ],
    })),
  );

  protected addRange(): void {
    this.rows()().value.update((rows) => [...rows, { start: '', end: '' }]);
  }

  protected removeRange(index: number): void {
    this.rows()().value.update((rows) => rows.filter((_, i) => i !== index));
  }
}
