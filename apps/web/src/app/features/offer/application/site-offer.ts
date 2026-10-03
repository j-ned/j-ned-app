import { Component } from '@angular/core';
import { ContactForm } from '@features/contact/application/contact-form';
import { SITE_OFFER } from '@features/offer/domain/site-offer.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OfferDeliverables } from './components/offer-deliverables';
import { OfferFaq } from './components/offer-faq';
import { OfferHero } from './components/offer-hero';
import { OfferPricing } from './components/offer-pricing';
import { OfferReasons } from './components/offer-reasons';
import { OfferTimeline } from './components/offer-timeline';

@Component({
  selector: 'app-site-offer',
  imports: [
    OfferHero,
    OfferReasons,
    OfferDeliverables,
    OfferTimeline,
    OfferPricing,
    OfferFaq,
    ContactForm,
  ],
  host: { class: 'block pt-20' },
  template: `
    <app-offer-hero [hero]="offer.hero" />
    <app-offer-reasons [reasons]="offer.reasons" />
    <app-offer-deliverables [deliverables]="offer.deliverables" />
    <app-offer-timeline [steps]="offer.steps" />
    <app-offer-pricing [pricing]="offer.pricing" [vatMention]="vatMention" />
    <app-offer-faq [faq]="offer.faq" />
    <div id="demande" class="scroll-mt-20" data-testid="offer-request">
      <app-contact-form [initialSubject]="offer.requestSubject" [intro]="offer.requestIntro" />
    </div>
  `,
})
export class SiteOffer {
  protected readonly offer = SITE_OFFER;
  protected readonly vatMention = SITE_IDENTITY.business.vatMention;
}
