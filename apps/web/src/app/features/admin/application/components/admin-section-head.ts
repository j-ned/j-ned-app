import { Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-admin-section-head',
  host: {
    class:
      'flex flex-wrap items-baseline justify-between gap-x-4 border-b-[1.5px] border-line-strong pb-3',
  },
  template: `
    <h2
      #headingElement
      tabindex="-1"
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

  private readonly _heading = viewChild.required<ElementRef<HTMLHeadingElement>>('headingElement');

  focusHeading(): void {
    this._heading().nativeElement.focus();
  }
}
