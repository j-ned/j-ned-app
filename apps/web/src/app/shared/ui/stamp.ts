import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stamp',
  host: {
    class:
      'inline-block rounded-part border-2 border-foreground bg-surface px-2.5 py-1 text-xs font-semibold text-foreground',
    '[class.border-dashed]': 'dashed()',
  },
  template: `<ng-content />`,
})
export class Stamp {
  readonly dashed = input(false);
}
