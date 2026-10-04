import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OfferSummary } from '@features/offer/domain/models/offer.model';
import { offerPath } from '@features/offer/domain/offer-path';

@Component({
  selector: 'app-offer-row',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <a
      data-testid="offer-row-link"
      [routerLink]="path()"
      class="group grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 py-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]"
    >
      <span class="grid gap-1">
        <span
          data-testid="offer-row-name"
          class="font-display text-lg font-bold leading-tight font-stretch-104% transition-colors group-hover:text-primary"
        >
          {{ summary().name }}
        </span>
        <span data-testid="offer-row-promise" class="text-[0.9375rem] text-muted">
          {{ summary().promise }}
        </span>
      </span>
      <span
        data-testid="offer-row-price"
        class="col-start-1 font-display text-base font-bold tabular-nums font-stretch-105% md:col-start-auto md:text-lg"
      >
        {{ summary().priceTeaser }}
      </span>
      <span
        aria-hidden="true"
        class="col-start-2 row-span-2 row-start-1 text-xl text-primary transition-transform group-hover:translate-x-1 motion-reduce:transition-none md:col-start-3 md:row-span-1"
      >
        →
      </span>
    </a>
  `,
})
export class OfferRow {
  readonly summary = input.required<OfferSummary>();
  protected readonly path = computed(() => offerPath(this.summary().slug));
}
