import { Component, input } from '@angular/core';

@Component({
  selector: 'fieldset[app-admin-form-section]',
  host: { 'data-testid': 'form-section', class: 'block min-w-0 scroll-mt-6' },
  template: `
    <legend class="float-left mb-5.5 block w-full border-b-[1.5px] border-line-strong pb-3 *:block">
      <span
        data-testid="form-section-title"
        class="font-display text-[1.3125rem] font-bold tracking-[-0.02em] font-stretch-106%"
      >
        <span class="font-mono text-[0.8125rem] font-normal tracking-normal text-primary"
          >{{ number() }} ·</span
        >
        {{ heading() }}
      </span>
      <span data-testid="form-section-description" class="mt-1 text-sm text-muted">
        {{ description() }}
      </span>
    </legend>
    <div class="clear-both">
      <ng-content />
    </div>
  `,
})
export class AdminFormSection {
  readonly number = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
}
