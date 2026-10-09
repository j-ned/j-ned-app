import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeFaq } from '../../application/home-faq';
import { HomeHeroSection } from '../../application/home-hero-section';
import { HomeMethod } from '../../application/home-method';
import { HomeOffers } from '../../application/home-offers';
import { HomeProjects } from '../../application/home-projects';
import { HomeWhy } from '../../application/home-why';
import { ContactForm } from '@features/contact/application/contact-form';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
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
    ContactForm,
    SectionVisibility,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col w-full' },
  template: `
    <!-- Premier écran : le hero occupe tout l'espace sous le header (h-20). -->
    <app-home-hero-section class="mt-20" [hero]="bundle()?.hero ?? null" />

    <app-home-offers />

    <!-- Projects Section -->
    @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
      <section class="w-full pb-24 md:pb-32" data-testid="home-projects-section">
        <div class="page-container">
          <app-home-projects [projects]="bundle()?.featuredProjects ?? []" />
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
        <app-contact-form data-testid="home-contact-form" [projectTypes]="projectTypes" />
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

  // Force le rendu des @defer avant un scroll vers une section (cf. SectionScroller).
  protected readonly eagerSections = inject(SectionScroller).eager;

  private readonly bundleResource = rxResource({
    stream: () => this._gateway.getHomeBundle(),
  });
  protected readonly bundle = computed(() => this.bundleResource.value());

  protected readonly projectTypes = [...OFFERS.map((offer) => offer.shortName), 'Autre'];
}
