import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OfferFamilyList } from '@features/offer/application/components/offer-family-list';
import { groupOffersByFamily } from '@features/offer/domain/group-offers-by-family';
import {
  OFFERS,
  OFFER_FAMILY_LABELS,
  OFFER_FAMILY_LEADS,
} from '@features/offer/domain/offer-catalog.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HOME_OFFERS_CATALOGUE_LINK, HOME_OFFERS_HEADING } from '../domain/home-offers.static-data';

@Component({
  selector: 'app-home-offers',
  imports: [OfferFamilyList, RouterLink],
  host: { class: 'block border-t border-line' },
  template: `
    <section
      class="page-container py-24 md:py-32"
      aria-labelledby="home-offers-heading"
      data-testid="home-offers"
    >
      <h2 id="home-offers-heading" class="section-title mb-12 max-w-[22ch]">{{ heading }}</h2>
      @for (group of groups; track group.family) {
        <div
          data-testid="home-offers-family"
          class="grid gap-6 border-t border-line py-10 first-of-type:border-t-0 first-of-type:pt-0 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12"
        >
          <div class="grid content-start gap-2">
            <h3 class="text-2xl font-bold tracking-tight">{{ familyLabels[group.family] }}</h3>
            <p
              data-testid="home-offers-family-lead"
              class="max-w-[40ch] text-[0.9375rem] text-muted"
            >
              {{ familyLeads[group.family] }}
            </p>
          </div>
          <app-offer-family-list [family]="group.family" [offers]="group.offers" />
        </div>
      }
      <div class="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <p data-testid="home-offers-vat-mention" class="text-sm text-muted">{{ vatMention }}</p>
        <a
          routerLink="/offres"
          class="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline"
          data-testid="home-offers-catalogue-link"
          >{{ catalogueLink }}</a
        >
      </div>
    </section>
  `,
})
export class HomeOffers {
  protected readonly heading = HOME_OFFERS_HEADING;
  protected readonly catalogueLink = HOME_OFFERS_CATALOGUE_LINK;
  protected readonly groups = groupOffersByFamily(OFFERS.filter((offer) => offer.featuredOnHome));
  protected readonly familyLabels = OFFER_FAMILY_LABELS;
  protected readonly familyLeads = OFFER_FAMILY_LEADS;
  protected readonly vatMention = SITE_IDENTITY.business.vatMention;
}
