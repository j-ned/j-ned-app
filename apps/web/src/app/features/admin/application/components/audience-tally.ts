import { Component, input } from '@angular/core';
import type { TallyRow } from '../audience-view';

@Component({
  selector: 'app-audience-tally',
  host: { 'data-testid': 'audience-tally', class: 'block min-w-0' },
  template: `
    <h3
      data-testid="tally-heading"
      class="font-mono text-xs tracking-[0.06em] text-muted uppercase"
    >
      {{ heading() }}
    </h3>
    @if (rows().length > 0) {
      <dl class="mt-3 border-t border-line text-sm">
        @for (row of rows(); track $index) {
          <div data-testid="tally-row" class="flex items-baseline gap-4 border-b border-line py-2">
            <dt class="min-w-0 flex-1 break-words">{{ row.label }}</dt>
            <dd class="font-mono tabular-nums">{{ row.value }}</dd>
          </div>
        }
      </dl>
    } @else {
      <p data-testid="tally-empty" class="mt-3 border-t border-line pt-2 text-sm text-muted">
        Rien sur la période.
      </p>
    }
  `,
})
export class AudienceTally {
  readonly heading = input.required<string>();
  readonly rows = input.required<readonly TallyRow[]>();
}
