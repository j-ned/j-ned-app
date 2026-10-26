import { Component, input } from '@angular/core';

@Component({
  selector: 'a[app-link-card]',
  host: {
    class:
      'group grid gap-1 rounded-card border-2 border-foreground bg-surface p-6 transition-colors hover:border-primary',
    '[class.text-right]': "align() === 'end'",
  },
  template: `
    <span class="font-mono text-xs text-muted">{{ overline() }}</span>
    <span
      class="text-[1.1875rem] font-semibold tracking-tight transition-colors group-hover:text-primary"
      >{{ heading() }}</span
    >
    @if (summary(); as summary) {
      <span class="text-muted">{{ summary }}</span>
    }
  `,
})
export class LinkCard {
  readonly overline = input.required<string>();
  readonly heading = input.required<string>();
  readonly summary = input<string>();
  readonly align = input<'start' | 'end'>('start');
}
