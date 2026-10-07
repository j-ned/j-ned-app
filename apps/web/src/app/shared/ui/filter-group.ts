import { Component, input, model } from '@angular/core';

export type FilterOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly count: number;
  readonly disabled?: boolean;
};

@Component({
  selector: 'app-filter-group',
  host: { class: 'block overflow-x-auto' },
  template: `
    <div
      data-testid="filter-group"
      role="group"
      [attr.aria-label]="label()"
      class="flex w-max min-w-full gap-1 shadow-[inset_0_-1px_0_var(--color-line)]"
    >
      @for (option of options(); track option.value) {
        <button
          data-testid="filter-option"
          type="button"
          [attr.aria-pressed]="option.value === active()"
          [attr.aria-disabled]="option.disabled ? 'true' : null"
          (click)="select(option)"
          class="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-2 text-sm sm:px-3 text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary aria-pressed:border-primary aria-pressed:font-semibold aria-pressed:text-foreground aria-disabled:cursor-not-allowed aria-disabled:*:opacity-50 aria-disabled:hover:text-muted"
        >
          <span data-testid="filter-option-label">{{ option.label }}</span>
          <span data-testid="filter-option-count" class="font-mono text-xs tabular-nums">
            {{ option.count }}
          </span>
        </button>
      }
    </div>
  `,
})
export class FilterGroup<T extends string> {
  readonly label = input.required<string>();
  readonly options = input.required<readonly FilterOption<T>[]>();
  readonly active = model.required<T>();

  protected select(option: FilterOption<T>): void {
    if (!option.disabled) {
      this.active.set(option.value);
    }
  }
}
