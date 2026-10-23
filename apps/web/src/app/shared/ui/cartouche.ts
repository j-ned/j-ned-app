import { Component, input } from '@angular/core';

export type CartoucheRow = { readonly label: string; readonly value: string };

@Component({
  selector: 'app-cartouche',
  host: {
    class: 'block overflow-hidden rounded-part border-2 border-foreground bg-surface text-sm',
    role: 'group',
    '[attr.aria-label]': 'title()',
  },
  template: `
    <div data-testid="cartouche-head" class="grid gap-1 border-b-2 border-foreground p-3.5">
      <p data-testid="cartouche-title" class="font-display font-bold">
        {{ title() }}
      </p>
      @if (reference()) {
        <p data-testid="cartouche-reference" class="font-mono text-xs text-muted">
          {{ reference() }}
        </p>
      }
    </div>
    @if (rows().length > 0) {
      <dl>
        @for (row of rows(); track $index) {
          <div
            data-testid="cartouche-row"
            class="grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-line-strong first:border-t-0"
          >
            <dt
              data-testid="cartouche-label"
              class="border-r border-line-strong px-3.5 py-2.5 text-xs font-semibold text-muted"
            >
              {{ row.label }}
            </dt>
            <dd data-testid="cartouche-value" class="px-3.5 py-2.5 font-medium tabular-nums">
              {{ row.value }}
            </dd>
          </div>
        }
      </dl>
    }
    <ng-content />
  `,
})
export class Cartouche {
  readonly title = input.required<string>();
  readonly reference = input<string>('');
  readonly rows = input<readonly CartoucheRow[]>([]);
}
