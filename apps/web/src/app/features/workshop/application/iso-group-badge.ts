import { Component, input } from '@angular/core';
import type { IsoGroup } from '../domain/models/material.model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';

@Component({
  selector: 'app-iso-group-badge',
  host: { class: 'inline-flex items-center gap-2 text-sm text-muted' },
  template: `
    {{ copy.isoGroup }}
    <span
      data-testid="iso-group-letter"
      class="inline-flex size-7 items-center justify-center rounded-full border border-foreground font-mono font-semibold text-foreground"
      >{{ group().letter }}</span
    >&ngsp;<span data-testid="iso-group-name" class="text-foreground">{{
      group().name.value
    }}</span>
  `,
})
export class IsoGroupBadge {
  readonly group = input.required<IsoGroup>();

  protected readonly copy = INSERT_GUIDE_COPY;
}
