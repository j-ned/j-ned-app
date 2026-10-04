import { Component, input } from '@angular/core';
import type { OfferPageContent } from '@features/offer/domain/models/offer.model';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-offer-pricing',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="offer-pricing-heading" [heading]="pricing().heading">
      <div class="grid gap-4 md:grid-cols-2">
        @for (line of pricing().lines; track line.id) {
          <article
            class="rounded-xl border border-foreground/8 bg-surface p-6"
            data-testid="offer-price-line"
          >
            <h3 class="text-xl font-semibold tracking-tight" data-testid="offer-price-name">
              {{ line.name }}
            </h3>
            <p
              class="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none"
              data-testid="offer-price-label"
            >
              {{ line.label }}
            </p>
            <p class="mt-3 leading-relaxed text-muted" data-testid="offer-price-terms">
              {{ line.terms }}
            </p>
            @if (line.includes) {
              <ul class="mt-4 space-y-1.5 text-[0.9375rem]" role="list">
                @for (include of line.includes; track include) {
                  <li data-testid="offer-price-include">{{ include }}</li>
                }
              </ul>
            }
          </article>
        }
      </div>
      <p class="mt-6 text-sm text-muted" data-testid="offer-vat-mention">{{ vatMention() }}</p>
    </app-split-section>
  `,
})
export class OfferPricing {
  readonly pricing = input.required<OfferPageContent['pricing']>();
  readonly vatMention = input.required<string>();
}
