import { Component, input } from '@angular/core';
import type { OfferPricingContent } from '@features/offer/domain/models/site-offer.model';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-offer-pricing',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="offer-pricing-heading" heading="Tarif">
      <div class="grid gap-4 md:grid-cols-2">
        <article
          class="rounded-xl border border-foreground/8 bg-surface p-6"
          data-testid="offer-price-creation"
        >
          <h3 class="text-xl font-semibold tracking-tight">Création</h3>
          <p class="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none">
            {{ pricing().creation.priceLabel }}
          </p>
          <p class="mt-3 leading-relaxed text-muted">{{ pricing().creation.terms }}</p>
        </article>
        <article
          class="rounded-xl border border-foreground/8 bg-surface p-6"
          data-testid="offer-price-maintenance"
        >
          <h3 class="text-xl font-semibold tracking-tight">Maintenance</h3>
          <p class="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none">
            {{ pricing().maintenance.priceLabel }}
          </p>
          <p class="mt-3 leading-relaxed text-muted">{{ pricing().maintenance.terms }}</p>
          <ul class="mt-4 space-y-1.5 text-[0.9375rem]" role="list">
            @for (include of pricing().maintenance.includes; track include) {
              <li data-testid="offer-maintenance-include">{{ include }}</li>
            }
          </ul>
        </article>
      </div>
      <p class="mt-6 text-sm text-muted" data-testid="offer-vat-mention">{{ vatMention() }}</p>
    </app-split-section>
  `,
})
export class OfferPricing {
  readonly pricing = input.required<OfferPricingContent>();
  readonly vatMention = input.required<string>();
}
