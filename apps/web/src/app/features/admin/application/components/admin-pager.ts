import { Component, input, output } from '@angular/core';
import { Button } from '@shared/ui/button';
import type { Pager } from '../pager';

@Component({
  selector: 'nav[app-admin-pager]',
  imports: [Button],
  host: {
    class: 'mt-6 flex flex-wrap items-center gap-3',
    '[attr.data-testid]': "testIdPrefix() + '-pager'",
    '[attr.aria-label]': 'label()',
  },
  template: `
    <button
      appButton
      variant="outlined"
      type="button"
      [attr.data-testid]="testIdPrefix() + '-newer'"
      [attr.aria-disabled]="pager().hasNewer ? null : 'true'"
      (click)="newer.emit()"
      class="aria-disabled:cursor-not-allowed aria-disabled:opacity-55 aria-disabled:hover:border-foreground/15 aria-disabled:hover:text-foreground"
    >
      {{ newerLabel() }}
    </button>
    <button
      appButton
      variant="outlined"
      type="button"
      [attr.data-testid]="testIdPrefix() + '-older'"
      [attr.aria-disabled]="pager().hasOlder ? null : 'true'"
      (click)="older.emit()"
      class="aria-disabled:cursor-not-allowed aria-disabled:opacity-55 aria-disabled:hover:border-foreground/15 aria-disabled:hover:text-foreground"
    >
      {{ olderLabel() }}
    </button>
    <p
      [attr.data-testid]="testIdPrefix() + '-page'"
      role="status"
      class="font-mono text-[0.8125rem] text-muted"
    >
      {{ pager().label }}
    </p>
  `,
})
export class AdminPager {
  readonly testIdPrefix = input.required<string>();
  readonly label = input.required<string>();
  readonly pager = input.required<Pager>();
  readonly newerLabel = input.required<string>();
  readonly olderLabel = input.required<string>();
  readonly newer = output<void>();
  readonly older = output<void>();
}
