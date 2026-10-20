import {
  Component,
  inject,
  ChangeDetectionStrategy,
  computed,
  effect,
  type EffectRef,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeHeroSection } from '../../application/home-hero-section';
import { HomeLatestPosts } from '../../application/home-latest-posts';
import { HomeProjects } from '../../application/home-projects';
import { HOME_HERO_CTA_LABELS } from '../../domain/home-hero.static-data';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { ContactForm } from '@features/contact/application/contact-form';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import type { FeaturedProjectView } from '@features/projects/application/featured-project-view';
import { ActiveSection } from '@core/navigation/active-section';
import { SectionVisibility } from '@core/navigation/section-visibility';
import { SectionScroller } from '@core/navigation/section-scroller';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeLatestPosts, HomeProjects, ContactForm, SectionVisibility],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col w-full' },
  template: `
    <!-- Premier écran : le hero occupe tout l'espace sous le header (h-20). -->
    <app-home-hero-section
      class="mt-20"
      [hero]="bundle()?.hero ?? null"
      (blogOpened)="trackBlogClick()"
      (projectsOpened)="trackProjectsClick()"
    />

    <!-- Derniers articles : le blog est le moteur du site (PRODUCT.md). Absente sans article publié. -->
    @if (latestPosts().length) {
      @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
        <div class="page-container w-full pb-24 md:pb-32">
          <app-home-latest-posts [posts]="latestPosts()" />
        </div>
      } @placeholder {
        <div class="block h-[38rem]" data-testid="home-latest-posts-placeholder"></div>
      } @error {
        <div class="block py-16 md:py-20 px-4 sm:px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }
    }

    <!-- Projects Section -->
    @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
      <section
        class="w-full border-t border-line pt-24 pb-24 md:pt-32 md:pb-32"
        data-testid="home-projects-section"
      >
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

    <!-- Contact (section de la landing) ; id pour le scroll programmatique unifié
         (SectionScroller), JAMAIS exposé comme ancre #contact dans l'URL.
         scroll-mt-20 compense le header fixe ; appSectionVisibility pilote
         l'indicateur d'état actif du header (scroll-spy). -->
    <div id="contact" class="scroll-mt-20" appSectionVisibility="contact">
      @defer (hydrate on viewport; on viewport; prefetch on idle; when eagerSections()) {
        <app-contact-form data-testid="home-contact-form" placement="home" />
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
  private readonly _activeSection = inject(ActiveSection);

  // Force le rendu des @defer avant un scroll vers une section (cf. SectionScroller).
  protected readonly eagerSections = this._scroller.eager;

  private readonly bundleResource = rxResource({
    stream: () => this._gateway.getHomeBundle(),
  });
  protected readonly bundle = computed(() => this.bundleResource.value());

  protected readonly latestPosts = computed(() => this.bundle()?.latestPosts ?? []);

  private readonly _contactArrivalEffect: EffectRef = effect(() => {
    if (this._activeSection.key() !== 'contact') return;
    this._analytics.trackSectionView('home_contact', '/');
    this._contactArrivalEffect.destroy();
  });

  protected trackBlogClick(): void {
    this._analytics.trackCtaClick('home_hero_blog', HOME_HERO_CTA_LABELS.blog);
  }

  protected trackProjectsClick(): void {
    this._analytics.trackCtaClick('home_hero_projects', HOME_HERO_CTA_LABELS.projects);
  }

  protected trackLiveLink({ id, title }: FeaturedProjectView): void {
    this._analytics.trackProjectClick(id, title);
  }
}
