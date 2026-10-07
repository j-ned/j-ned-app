import { Component, input } from '@angular/core';

export type ReadoutItem = {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly detail: string;
};

@Component({
  selector: 'app-admin-readout',
  host: { class: 'block' },
  template: `
    <dl
      class="grid grid-cols-2 border-t-[1.5px] border-b border-t-line-strong border-b-line sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none"
    >
      @for (item of items(); track item.label) {
        <div
          data-testid="readout-item"
          class="border-line py-4 pr-4.5 max-sm:even:border-l max-sm:even:pl-4.5 max-sm:nth-[n+3]:border-t sm:not-first:border-l sm:not-first:pl-4.5"
        >
          <dt class="font-mono text-xs tracking-[0.06em] text-muted uppercase">{{ item.label }}</dt>
          <dd class="mt-1.5">
            <span
              data-testid="readout-value"
              class="block font-display text-[2.125rem] leading-none font-bold tracking-[-0.02em] tabular-nums"
              >{{ item.value
              }}<span class="text-[0.55em] tracking-normal">{{ item.unit }}</span></span
            >
            <span data-testid="readout-detail" class="mt-1.5 block text-[0.8125rem] text-muted">
              {{ item.detail }}
            </span>
          </dd>
        </div>
      }
    </dl>
  `,
})
export class AdminReadout {
  readonly items = input.required<readonly ReadoutItem[]>();
}
