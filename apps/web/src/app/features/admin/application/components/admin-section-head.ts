import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-section-head',
  host: {
    class:
      'flex flex-wrap items-baseline justify-between gap-x-4 border-b-[1.5px] border-line-strong pb-3',
  },
  template: `
    <h2
      [id]="headingId()"
      [attr.data-testid]="headingId()"
      class="font-display text-[1.375rem] font-bold tracking-[-0.02em] font-stretch-106%"
    >
      {{ heading() }}
    </h2>
    <ng-content />
  `,
})
export class AdminSectionHead {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
}
