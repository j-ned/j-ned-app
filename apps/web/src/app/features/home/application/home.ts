import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeHeroSection } from './home-hero-section';
import { HomeProjects } from './home-projects';
import { HomeProof } from './home-proof';
import { ContactForm } from '@features/contact/application/contact-form';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { SectionVisibility } from '@core/navigation/section-visibility';
import { SectionScroller } from '@core/navigation/section-scroller';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeProof, HomeProjects, ContactForm, SectionVisibility],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col w-full' },
  template: `
    <!-- Premier écran : le hero occupe tout l'espace sous le header (h-20). -->
    <app-home-hero-section class="mt-20" [hero]="bundle()?.hero ?? null" />

    @if (highlights().length > 0) {
      <app-home-proof [highlights]="highlights()" [buildSteps]="buildSteps()" />
    } @else {
      <!-- Réserve la hauteur de la grille des preuves tant que le bundle n'est pas chargé. -->
      <div class="page-container py-24 md:py-32" aria-hidden="true">
        <div
          class="h-[52rem] md:h-[40rem] xl:h-[30rem] rounded-xl bg-foreground/2 animate-pulse"
        ></div>
      </div>
    }

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

    <!-- Contact (section de la landing) ; id pour le scroll programmatique unifié
         (SectionScroller), JAMAIS exposé comme ancre #contact dans l'URL.
         scroll-mt-20 compense le header fixe ; appSectionVisibility pilote
         l'indicateur d'état actif du header (scroll-spy). -->
    <div id="contact" class="scroll-mt-20" appSectionVisibility="contact">
      @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
        <app-contact-form data-testid="home-contact-form" />
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
  protected readonly highlights = computed(() => this.bundle()?.highlights ?? []);
  protected readonly buildSteps = computed(() => this.bundle()?.buildSteps ?? []);
}
