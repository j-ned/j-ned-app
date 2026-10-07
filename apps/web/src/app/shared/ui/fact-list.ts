import { Component, input } from '@angular/core';

export type Fact = { readonly label: string; readonly value: string };

@Component({
  selector: 'app-fact-list',
  host: { class: 'block' },
  template: `
    <dl
      data-testid="fact-list"
      class="grid grid-cols-[6.5rem_minmax(0,1fr)] border-t border-line text-sm"
    >
      @for (fact of facts(); track fact.label) {
        <div class="col-span-full grid grid-cols-subgrid gap-x-4 border-b border-line py-2.5">
          <dt data-testid="fact-label" class="font-mono text-xs leading-5 text-muted">
            {{ fact.label }}
          </dt>
          <dd data-testid="fact-value">{{ fact.value }}</dd>
        </div>
      }
    </dl>
  `,
})
export class FactList {
  readonly facts = input.required<readonly Fact[]>();
}
