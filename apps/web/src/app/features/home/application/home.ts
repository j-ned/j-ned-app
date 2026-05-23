import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeHeroSection } from './home-hero-section';
import { HomeProjects } from './home-projects';
import { ContactForm } from '@features/contact/application';
import { GetHomeBundleUseCase } from '@features/home/domain';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeProjects, ContactForm, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="flex flex-col w-full">
      <!-- First fold: hero + expertise vertically centered under header -->
      <div class="flex flex-col justify-center min-h-[calc(100svh-5rem)] mt-20">
        <!-- Hero Section -->
        <app-home-hero-section [hero]="bundle()?.hero ?? null" />

        <!-- Expertise Section -->
        <section class="w-full pt-2 pb-10 md:pt-4 md:pb-12" aria-labelledby="expertise-heading">
          <div class="max-w-7xl mx-auto px-6">
            <h2 id="expertise-heading" class="sr-only">Expertises</h2>
            @if (expertises().length > 0) {
              <ul class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" role="list">
                @for (item of expertises(); track item.id) {
                  <li
                    class="group relative p-6 rounded-xl border border-foreground/8 bg-foreground/2 hover:border-primary/30 hover:bg-foreground/4 transition-colors duration-300 min-h-55.5"
                  >
                    <div class="flex items-center gap-3 mb-4">
                      <div class="icon-tile bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                        <app-icon [name]="item.icon" [size]="20" class="text-primary" />
                      </div>
                      <h3 class="text-sm font-bold text-primary uppercase tracking-widest">
                        {{ item.title }}
                      </h3>
                    </div>
                    <p class="text-sm text-muted leading-relaxed line-clamp-5">
                      {{ item.description }}
                    </p>
                  </li>
                }
              </ul>
            } @else {
              <!-- Skeleton placeholder: hauteur fixe 222px (doit matcher min-h de la vraie card) -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8" aria-hidden="true">
                @for (_ of [1, 2, 3]; track $index) {
                  <div
                    class="p-6 rounded-xl border border-foreground/8 bg-foreground/2 animate-pulse min-h-55.5"
                  >
                    <div class="flex items-center gap-3 mb-4">
                      <div class="icon-tile bg-foreground/5"></div>
                      <div class="h-3.5 bg-foreground/5 rounded w-32"></div>
                    </div>
                    <div class="h-28.5 rounded bg-foreground/5"></div>
                  </div>
                }
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Projects Section -->
      @defer (on viewport; prefetch on idle) {
        <section class="w-full py-8 md:py-12">
          <div class="max-w-7xl mx-auto px-6">
            <app-home-projects [projects]="bundle()?.featuredProjects ?? []" />
          </div>
        </section>
      } @placeholder {
        <div class="block py-8 px-6 h-64"></div>
      } @error {
        <div class="block py-8 px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }

      <!-- Contact Section : hydrate on viewport pour que #contact soit
           dans le DOM des le prerender (les liens d'ancre fonctionnent
           immediatement, avant l'hydration JS). -->
      @defer (hydrate on viewport) {
        <app-contact-form />
      } @placeholder {
        <div class="block py-20 px-6 h-96"></div>
      } @error {
        <div class="block py-12 px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }
    </main>
  `,
})
export class Home {
  private readonly _getHomeBundle = inject(GetHomeBundleUseCase);

  private readonly bundleResource = rxResource({
    stream: () => this._getHomeBundle.execute(),
  });
  protected readonly bundle = computed(() => this.bundleResource.value());
  protected readonly expertises = computed(() => this.bundle()?.highlights ?? []);
}
