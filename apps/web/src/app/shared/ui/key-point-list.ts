import { Component, input } from '@angular/core';

type KeyPoint = { readonly id: string; readonly lead: string; readonly detail: string };

@Component({
  selector: 'app-key-point-list',
  host: { class: 'block' },
  template: `
    <ul role="list">
      @for (point of points(); track point.id) {
        <li
          class="grid gap-1 border-t border-line py-4.5 last:border-b sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
          data-testid="key-point"
        >
          <p class="font-semibold" data-testid="key-point-lead">{{ point.lead }}</p>
          <p class="text-[0.9375rem] text-muted" data-testid="key-point-detail">
            {{ point.detail }}
          </p>
        </li>
      }
    </ul>
  `,
})
export class KeyPointList {
  readonly points = input.required<readonly KeyPoint[]>();
}
