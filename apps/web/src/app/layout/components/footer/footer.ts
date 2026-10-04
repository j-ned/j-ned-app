import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionScroller } from '@core/navigation/section-scroller';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { offerPath } from '@features/offer/domain/offer-path';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { FOOTER_COPY } from './footer.static-data';

const RESOURCE_LINKS = [
  { href: '/projects', label: FOOTER_COPY.resources.projects },
  { href: '/blog', label: FOOTER_COPY.resources.blog },
  { href: '/about', label: FOOTER_COPY.resources.about },
] as const;

const SOCIAL_LINKS = [
  { href: SITE_IDENTITY.socials.malt, label: FOOTER_COPY.socials.malt },
  { href: SITE_IDENTITY.socials.linkedin, label: FOOTER_COPY.socials.linkedin },
  { href: SITE_IDENTITY.socials.github, label: FOOTER_COPY.socials.github },
] as const;

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-t border-nav-border bg-surface' },
  template: `
    <footer class="page-container pt-14 pb-8 text-sm">
      <div
        class="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]"
      >
        <div class="grid content-start gap-2.5 sm:col-span-2 md:col-span-1">
          <p class="font-display text-lg font-bold text-foreground">{{ copy.legal.owner }}</p>
          <p data-testid="footer-tagline" class="max-w-88 text-muted">{{ copy.tagline }}</p>
        </div>

        <nav aria-labelledby="footer-offers-heading">
          <h2 id="footer-offers-heading" data-testid="footer-column-heading" class="footer-heading">
            {{ copy.headings.offers }}
          </h2>
          <ul class="grid md:gap-2" role="list">
            @for (offer of offers; track offer.slug) {
              <li>
                <a data-testid="footer-offer-link" [routerLink]="offer.path" class="footer-link">{{
                  offer.label
                }}</a>
              </li>
            }
          </ul>
        </nav>

        <nav aria-labelledby="footer-resources-heading">
          <h2
            id="footer-resources-heading"
            data-testid="footer-column-heading"
            class="footer-heading"
          >
            {{ copy.headings.resources }}
          </h2>
          <ul class="grid md:gap-2" role="list">
            @for (link of resourceLinks; track link.href) {
              <li>
                <a
                  data-testid="footer-resource-link"
                  [routerLink]="link.href"
                  class="footer-link"
                  >{{ link.label }}</a
                >
              </li>
            }
            <li>
              <a
                data-testid="footer-hiring-link"
                routerLink="/about"
                fragment="recrutement"
                class="footer-link"
                >{{ copy.hiringLink }}</a
              >
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-contact-heading">
          <h2
            id="footer-contact-heading"
            data-testid="footer-column-heading"
            class="footer-heading"
          >
            {{ copy.headings.contact }}
          </h2>
          <ul class="grid md:gap-2" role="list">
            <li>
              <button
                type="button"
                data-testid="footer-contact-cta"
                (click)="scrollToContact()"
                class="inline-flex cursor-pointer items-center text-left font-semibold text-primary hover:text-foreground transition-colors max-md:min-h-11"
              >
                {{ copy.contactCta }}
              </button>
            </li>
            @for (social of socialLinks; track social.href) {
              <li>
                <a
                  data-testid="footer-social-link"
                  [href]="social.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="footer-link"
                  >{{ social.label }}</a
                >
              </li>
            }
          </ul>
        </nav>
      </div>

      <div
        data-testid="footer-legal"
        class="mt-14 flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-xs leading-relaxed text-muted"
      >
        <p data-testid="footer-legal-mention">
          &copy; {{ currentYear }} {{ copy.legal.owner }} · {{ copy.legal.status }} ·
          <span class="whitespace-nowrap">{{ copy.legal.siretLabel }} {{ business.siret }}</span> ·
          {{ business.vatMention }}
        </p>
        <p class="flex flex-wrap gap-x-4 md:gap-y-1">
          <a data-testid="footer-legal-link" routerLink="/mentions-legales" class="footer-link">{{
            copy.legal.legalNotice
          }}</a>
          <a data-testid="footer-legal-link" routerLink="/confidentialite" class="footer-link">{{
            copy.legal.privacy
          }}</a>
        </p>
      </div>
    </footer>
  `,
})
export class Footer {
  private readonly scroller = inject(SectionScroller);

  protected readonly copy = FOOTER_COPY;
  protected readonly business = SITE_IDENTITY.business;
  protected readonly offers = OFFERS.map((offer) => ({
    slug: offer.slug,
    path: offerPath(offer.slug),
    label: offer.shortName,
  }));
  protected readonly resourceLinks = RESOURCE_LINKS;
  protected readonly socialLinks = SOCIAL_LINKS;
  protected readonly currentYear = new Date().getFullYear();

  protected scrollToContact(): void {
    this.scroller.scrollTo('contact');
  }
}
