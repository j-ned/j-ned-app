import { Component, input } from '@angular/core';
import { Stamp } from '@shared/ui/stamp';

@Component({
  selector: 'app-admin-empty-state',
  imports: [Stamp],
  host: {
    'data-testid': 'empty-state',
    class:
      'grid justify-items-start gap-2.5 rounded-sm border border-dashed border-line-strong px-5.5 py-6.5 text-sm text-muted [&_p]:max-w-[42ch]',
  },
  template: `
    <app-stamp data-testid="empty-state-stamp">{{ stamp() }}</app-stamp>
    <ng-content />
  `,
})
export class AdminEmptyState {
  readonly stamp = input.required<string>();
}
