import { Component } from '@angular/core';

@Component({
  selector: 'app-stamp',
  host: {
    class:
      'inline-block rounded-sm border border-line-strong bg-background px-2 py-1 font-mono text-xs uppercase tracking-[0.06em] text-foreground',
  },
  template: `<ng-content />`,
})
export class Stamp {}
