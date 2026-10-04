import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OfferSummary } from '@features/offer/domain/models/offer.model';
import { offerPath } from '@features/offer/domain/offer-path';
import { Cartouche } from '@shared/ui/cartouche';

@Component({
  selector: 'app-offer-card',
  imports: [Cartouche, RouterLink],
  host: { class: 'block h-full' },
  template: `
    <app-cartouche
      class="relative flex h-full flex-col transition-colors hover:border-accent"
      [title]="summary().name"
      [reference]="summary().audience"
    >
      <p class="flex-1 px-3.5 pt-4 pb-5 text-base font-medium leading-snug">
        {{ summary().promise }}
      </p>
      <div
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-3.5 py-3"
      >
        <p
          data-testid="offer-card-price"
          class="font-display text-xl font-bold tabular-nums tracking-tight font-stretch-105%"
        >
          {{ summary().priceTeaser }}
        </p>
        <a
          data-testid="offer-card-link"
          [routerLink]="path()"
          class="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary after:absolute after:inset-0 hover:underline"
        >
          Détail de l'offre<span class="sr-only">&nbsp;: {{ summary().name }}</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </app-cartouche>
  `,
})
export class OfferCard {
  readonly summary = input.required<OfferSummary>();
  protected readonly path = computed(() => offerPath(this.summary().slug));
}
