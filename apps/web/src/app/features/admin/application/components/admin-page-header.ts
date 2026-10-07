import { Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'app-admin-page-header',
  host: { class: 'block' },
  template: `
    <header
      class="grid gap-6 pb-8 lg:items-end lg:gap-12 lg:has-[>[adminPageAside]]:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div>
        <p
          data-testid="admin-page-overline"
          class="min-h-lh font-mono text-[0.8125rem] text-primary"
        >
          {{ overline() }}
        </p>
        <h1
          #title
          tabindex="-1"
          data-testid="admin-page-title"
          class="mt-3.5 text-[2.5rem] leading-none font-extrabold tracking-[-0.04em] lg:text-[clamp(2.25rem,3.4vw,3.25rem)]"
        >
          {{ heading() }}
        </h1>
        <div class="mt-4 max-w-[60ch] text-base text-muted empty:hidden lg:text-[1.0625rem]">
          <ng-content />
        </div>
      </div>
      <ng-content select="[adminPageAside]" />
    </header>
  `,
})
export class AdminPageHeader {
  readonly overline = input.required<string>();
  readonly heading = input.required<string>();

  private readonly _title = viewChild.required<ElementRef<HTMLHeadingElement>>('title');

  focusTitle(): void {
    this._title().nativeElement.focus();
  }
}
