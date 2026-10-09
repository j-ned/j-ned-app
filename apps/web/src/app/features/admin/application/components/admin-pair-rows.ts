import { Component, computed, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';

export type PairRow<A extends string, B extends string> = Readonly<Record<A | B, string>>;

type PairColumn<K extends string> = {
  readonly key: K;
  readonly label: string;
  readonly slug: string;
  readonly placeholder: string;
};

export type PairRowsConfig<A extends string, B extends string> = {
  readonly heading: string;
  readonly idPrefix: string;
  readonly testIdPrefix: string;
  readonly first: PairColumn<A>;
  readonly second: PairColumn<B>;
  readonly removeLabel: string;
  readonly addLabel: string;
};

@Component({
  selector: 'app-admin-pair-rows',
  imports: [FormField, AppIcon, Button, FieldError],
  host: { class: 'block' },
  template: `
    @let settings = config();
    <h2 class="mt-6.5 mb-1 font-display text-base font-bold font-stretch-104%">
      {{ settings.heading }}
    </h2>
    <div class="border-t border-line">
      <div
        aria-hidden="true"
        class="grid grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_2.75rem] gap-2.5 pt-2.5 pb-2 font-mono text-xs uppercase tracking-[0.06em] text-muted max-sm:hidden"
      >
        <span>N°</span><span>{{ settings.first.label }}</span
        ><span>{{ settings.second.label }}</span>
      </div>
      @for (line of lines(); track line.row; let rowIndex = $index) {
        @let rank = rowIndex + 1;
        <div
          class="grid grid-cols-[2rem_minmax(0,1fr)_2.75rem] items-start gap-2.5 border-t border-line py-2.5 sm:grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_2.75rem]"
        >
          <span
            [attr.data-testid]="settings.testIdPrefix + '-rank'"
            class="pt-3.5 font-mono text-xs text-muted"
            >{{ rank < 10 ? '0' + rank : rank }}</span
          >
          @for (cell of line.cells; track cell.column.slug) {
            @let id = settings.idPrefix + '-' + rank + '-' + cell.column.slug;
            @let errorId = id + '-error';
            @let inError = cell.field().touched() && cell.field().invalid();
            <div [class]="$last ? 'max-sm:col-start-2 max-sm:row-start-2' : ''">
              <label class="sr-only" [for]="id">{{ cell.column.label }} {{ rank }}</label>
              <input
                [id]="id"
                [attr.data-testid]="settings.testIdPrefix + '-' + cell.column.slug"
                [formField]="cell.field"
                [placeholder]="cell.column.placeholder"
                [attr.aria-invalid]="inError"
                [attr.aria-describedby]="inError ? errorId : null"
                class="form-input"
              />
              <app-field-error
                [field]="cell.field"
                [errorId]="errorId"
                [testId]="settings.testIdPrefix + '-' + cell.column.slug + '-error'"
              />
            </div>
          }
          <button
            appButton
            type="button"
            variant="text-danger"
            size="icon"
            [attr.data-testid]="settings.testIdPrefix + '-remove'"
            class="max-sm:col-start-3 max-sm:row-start-1"
            [attr.aria-label]="settings.removeLabel + ' ' + rank"
            (click)="removeRow(rowIndex)"
          >
            <app-icon name="trash" [size]="18" />
          </button>
        </div>
      }
    </div>
    <button
      appButton
      type="button"
      variant="text"
      [attr.data-testid]="settings.testIdPrefix + '-add'"
      class="mt-1.5"
      (click)="addRow()"
    >
      <app-icon name="plus" [size]="16" />{{ settings.addLabel }}
    </button>
  `,
})
export class AdminPairRows<A extends string, B extends string> {
  readonly rows = input.required<FieldTree<PairRow<A, B>[]>>();
  readonly config = input.required<PairRowsConfig<A, B>>();

  protected readonly lines = computed(() => {
    const { first, second } = this.config();
    return Array.from(this.rows(), (row) => {
      const fields = row as unknown as Readonly<Record<A | B, FieldTree<string>>>;
      return {
        row,
        cells: [
          { column: first, field: fields[first.key] },
          { column: second, field: fields[second.key] },
        ],
      };
    });
  });

  protected addRow(): void {
    const { first, second } = this.config();
    const blank = { [first.key]: '', [second.key]: '' } as PairRow<A, B>;
    this.rows()().value.update((rows) => [...rows, blank]);
  }

  protected removeRow(index: number): void {
    this.rows()().value.update((rows) => rows.filter((_, i) => i !== index));
  }
}
