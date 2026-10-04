import { Component } from '@angular/core';
import {
  OFFERS,
  OFFER_CATALOGUE_HEADING,
  OFFER_CATALOGUE_LEAD,
  OFFER_FAMILY_LABELS,
  OFFER_FAMILY_LEADS,
} from '@features/offer/domain/offer-catalog.static-data';
import { groupOffersByFamily } from '@features/offer/domain/group-offers-by-family';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OfferFamilyList } from './components/offer-family-list';

@Component({
  selector: 'app-offer-catalogue',
  imports: [OfferFamilyList],
  host: { class: 'block pt-20' },
  template: `
    <div class="page-container pt-18 pb-22 md:pt-26 md:pb-30">
      <h1
        class="max-w-[22ch] text-[clamp(2.25rem,5.4vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance"
      >
        {{ heading }}
      </h1>
      <p
        data-testid="offer-catalogue-lead"
        class="mt-7 max-w-[60ch] text-lg leading-[1.65] text-muted"
      >
        {{ lead }}
      </p>
      <div class="mt-12 md:mt-16">
        @for (group of groups; track group.family) {
          <section
            [attr.aria-labelledby]="'offer-family-' + group.family"
            class="grid gap-6 border-t border-line py-10 first:border-t-0 first:pt-0 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12"
          >
            <div class="grid content-start gap-2">
              <h2
                [id]="'offer-family-' + group.family"
                class="text-2xl font-bold tracking-tight lg:text-[1.75rem]"
              >
                {{ familyLabels[group.family] }}
              </h2>
              <p data-testid="offer-family-lead" class="max-w-[40ch] text-[0.9375rem] text-muted">
                {{ familyLeads[group.family] }}
              </p>
            </div>
            <app-offer-family-list [family]="group.family" [offers]="group.offers" />
          </section>
        }
      </div>
      <p data-testid="offer-vat-mention" class="text-sm text-muted">{{ vatMention }}</p>
    </div>
  `,
})
export class OfferCatalogue {
  protected readonly heading = OFFER_CATALOGUE_HEADING;
  protected readonly groups = groupOffersByFamily(OFFERS);
  protected readonly lead = OFFER_CATALOGUE_LEAD;
  protected readonly familyLabels = OFFER_FAMILY_LABELS;
  protected readonly familyLeads = OFFER_FAMILY_LEADS;
  protected readonly vatMention = SITE_IDENTITY.business.vatMention;
}
