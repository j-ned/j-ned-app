import { Component, input } from '@angular/core';

export type CartoucheRow = { readonly label: string; readonly value: string };

@Component({
  selector: 'app-cartouche',
  host: {
    class: 'block rounded-sm border-[1.5px] border-line-strong bg-surface text-sm',
    role: 'group',
    '[attr.aria-label]': 'title()',
  },
  template: `
    <div class="grid gap-1 border-b-[1.5px] border-line-strong p-3.5">
      <p data-testid="cartouche-title" class="font-display font-bold font-stretch-110%">
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
            class="grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-line first:border-t-0"
          >
            <dt
              data-testid="cartouche-label"
              class="border-r border-line px-3.5 py-2.5 font-mono text-xs uppercase tracking-[0.06em] text-muted"
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
