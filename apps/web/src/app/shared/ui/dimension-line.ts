import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dimension-line',
  host: {
    'aria-hidden': 'true',
    class: 'flex max-w-120 items-center text-primary',
  },
  template: `
    <span class="h-3.5 border-l-2 border-current"></span>
    <span class="size-0 border-y-[5px] border-r-10 border-y-transparent border-r-current"></span>
    <span class="flex-1 border-t-2 border-current"></span>
    <span data-testid="dimension-line-label" class="shrink-0 px-2 font-mono text-xs font-medium">{{
      label()
    }}</span>
    <span class="flex-1 border-t-2 border-current"></span>
    <span class="size-0 border-y-[5px] border-l-10 border-y-transparent border-l-current"></span>
    <span class="h-3.5 border-l-2 border-current"></span>
  `,
})
export class DimensionLine {
  readonly label = input.required<string>();
}
