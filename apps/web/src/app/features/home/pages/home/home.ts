import {
  Component,
  inject,
  ChangeDetectionStrategy,
  computed,
  effect,
  type EffectRef,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeFaq } from '../../application/home-faq';
import { HomeHeroSection } from '../../application/home-hero-section';
import { HomeMethod } from '../../application/home-method';
import { HomeOffers } from '../../application/home-offers';
import { HomeProjects } from '../../application/home-projects';
import { HomeReviews } from '../../application/home-reviews';
import { HomeWhy } from '../../application/home-why';
import { HOME_HERO_CTA_LABELS } from '../../domain/home-hero.static-data';
import { HOME_RECRUITER_BAND_COPY } from '../../domain/home-recruiter-band.static-data';
import { HOME_REVIEWS } from '../../domain/home-reviews.static-data';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { ContactForm } from '@features/contact/application/contact-form';
import { CvDownload } from '@features/cv/application/cv-download';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import type { FeaturedProjectView } from '@features/projects/application/featured-project-view';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { ActiveSection } from '@core/navigation/active-section';
import { SectionVisibility } from '@core/navigation/section-visibility';
import { SectionScroller } from '@core/navigation/section-scroller';

@Component({
  selector: 'app-home',
  imports: [
    HomeHeroSection,
    HomeOffers,
    HomeProjects,
    HomeMethod,
    HomeWhy,
    HomeFaq,
    HomeReviews,
    ContactForm,
    SectionVisibility,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col w-full' },
  providers: [CvDownload],
  template: `
    <!-- Premier écran : le hero occupe tout l'espace sous le header (h-20). -->
    <app-home-hero-section
      class="mt-20"
      [hero]="bundle()?.hero ?? null"
      [cvUrl]="cvUrl()"
      (contactRequested)="goToContact()"
      (offersOpened)="trackOffersClick()"
      (hiringOpened)="trackRecruiterClick('home_recruiter_about', recruiterCopy.hiring)"
      (cvDownloaded)="trackCvDownload()"
      (linkedinOpened)="trackRecruiterClick('home_recruiter_linkedin', recruiterCopy.linkedin)"
      (githubOpened)="trackRecruiterClick('home_recruiter_github', recruiterCopy.github)"
    />

    <app-home-offers />

    <!-- Projects Section -->
    @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
      <section class="w-full pb-24 md:pb-32" data-testid="home-projects-section">
        <div class="page-container">
          <app-home-projects
            [projects]="bundle()?.featuredProjects ?? []"
            (liveLinkClicked)="trackLiveLink($event)"
          />
        </div>
      </section>
    } @placeholder {
      <div
        class="block py-16 md:py-20 px-4 sm:px-6 h-64"
        data-testid="home-projects-placeholder"
      ></div>
    } @error {
      <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
        Impossible de charger cette section.
      </div>
    }

    <!-- Ancre de l'entrée de menu « Méthode » : hors @defer pour exister avant le rendu de la section. -->
    <div id="methode" class="scroll-mt-20" appSectionVisibility="methode">
      @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
        <app-home-method class="border-t border-line" />
      } @placeholder {
        <div
          class="h-[92rem] border-t border-line sm:h-[62rem] md:h-[63.25rem] lg:h-[46.75rem] xl:h-[45.375rem]"
          data-testid="home-method-placeholder"
        ></div>
      } @error {
        <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }
    </div>

    @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
      <app-home-why class="border-t border-line" />
    } @placeholder {
      <div
        class="h-[60rem] border-t border-line sm:h-[45.25rem] md:h-[49.25rem] lg:h-[39.5rem] xl:h-[36.875rem]"
        data-testid="home-why-placeholder"
      ></div>
    } @error {
      <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
        Impossible de charger cette section.
      </div>
    }

    @if (reviews.length) {
      @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
        <app-home-reviews class="border-t border-line" [reviews]="reviews" />
      } @placeholder {
        <div class="h-[36rem] border-t border-line" data-testid="home-reviews-placeholder"></div>
      } @error {
        <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }
    }

    @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
      <app-home-faq class="border-t border-line" />
    } @placeholder {
      <div
        class="h-[44rem] border-t border-line sm:h-[41rem] md:h-[45rem] lg:h-[32rem] xl:h-[32.5rem]"
        data-testid="home-faq-placeholder"
      ></div>
    } @error {
      <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
        Impossible de charger cette section.
      </div>
    }

    <!-- Contact (section de la landing) ; id pour le scroll programmatique unifié
         (SectionScroller), JAMAIS exposé comme ancre #contact dans l'URL.
         scroll-mt-20 compense le header fixe ; appSectionVisibility pilote
         l'indicateur d'état actif du header (scroll-spy). -->
    <div id="contact" class="scroll-mt-20" appSectionVisibility="contact">
      @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
        <app-contact-form
          data-testid="home-contact-form"
          placement="home"
          [projectTypes]="projectTypes"
        />
      } @placeholder {
        <div
          class="block py-16 md:py-20 px-4 sm:px-6 h-96"
          data-testid="home-contact-placeholder"
        ></div>
      } @error {
        <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }
    </div>
  `,
})
export class Home {
  private readonly _gateway = inject(HomeGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _scroller = inject(SectionScroller);
  private readonly _cvDownload = inject(CvDownload);
  private readonly _activeSection = inject(ActiveSection);

  // Force le rendu des @defer avant un scroll vers une section (cf. SectionScroller).
  protected readonly eagerSections = this._scroller.eager;

  private readonly bundleResource = rxResource({
    stream: () => this._gateway.getHomeBundle(),
  });
  protected readonly bundle = computed(() => this.bundleResource.value());

  protected readonly cvUrl = this._cvDownload.url;
  protected readonly recruiterCopy = HOME_RECRUITER_BAND_COPY;
  protected readonly reviews = HOME_REVIEWS;

  protected readonly projectTypes = [...OFFERS.map((offer) => offer.shortName), 'Autre'];

  private readonly _contactArrivalEffect: EffectRef = effect(() => {
    if (this._activeSection.key() !== 'contact') return;
    this._analytics.trackSectionView('home_contact', '/');
    this._contactArrivalEffect.destroy();
  });

  protected goToContact(): void {
    this._analytics.trackCtaClick('home_hero_contact', HOME_HERO_CTA_LABELS.contact);
    this._scroller.scrollTo('contact');
  }

  protected trackOffersClick(): void {
    this._analytics.trackCtaClick('home_hero_offers', HOME_HERO_CTA_LABELS.offers);
  }

  protected trackRecruiterClick(ctaId: string, label: string): void {
    this._analytics.trackCtaClick(ctaId, label);
  }

  protected trackCvDownload(): void {
    this._cvDownload.track();
  }

  protected trackLiveLink({ id, title }: FeaturedProjectView): void {
    this._analytics.trackProjectClick(id, title);
  }
}
