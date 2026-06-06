import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeHeroSection } from './home-hero-section';
import { HomeProjects } from './home-projects';
import { RouterLink } from '@angular/router';
import { HomeGateway } from '@features/home/domain';
import { AppIcon } from '@shared/icons';
import { AppIconTile } from '@shared/ui';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeProjects, RouterLink, AppIcon, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="flex flex-col w-full">
      <!-- First fold: hero + expertise vertically centered under header -->
      <div class="flex flex-col justify-center min-h-[calc(100svh-5rem)] mt-20">
        <!-- Hero Section -->
        <app-home-hero-section [hero]="bundle()?.hero ?? null" />

        <!-- Expertise Section -->
        <section class="w-full py-12 md:py-16" aria-labelledby="expertise-heading">
          <div class="page-container">
            <h2 id="expertise-heading" class="sr-only">Expertises</h2>
            @if (expertises().length > 0) {
              <ul class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" role="list">
                @for (item of expertises(); track item.id) {
                  <li
                    class="group animate-fade-up relative p-6 rounded-xl border border-foreground/8 bg-foreground/2 hover:border-primary/30 hover:bg-foreground/4 transition-colors duration-300 min-h-55.5"
                  >
                    <div class="flex items-center gap-3 mb-4">
                      <app-icon-tile class="bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                        <app-icon [name]="item.icon" [size]="20" class="text-primary" />
                      </app-icon-tile>
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
                      <app-icon-tile class="bg-foreground/5" />
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
        <section class="w-full py-16 md:py-20">
          <div class="page-container">
            <app-home-projects [projects]="bundle()?.featuredProjects ?? []" />
          </div>
        </section>
      } @placeholder {
        <div class="block py-16 md:py-20 px-6 h-64"></div>
      } @error {
        <div class="block py-16 md:py-20 px-6 text-center text-muted text-sm">
          Impossible de charger cette section.
        </div>
      }

      <!-- Contact CTA : la page contact est une route dédiée (/contact), pas une ancre -->
      <section class="w-full py-16 md:py-20" aria-labelledby="contact-cta-heading">
        <div class="page-container text-center">
          <h2 id="contact-cta-heading" class="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Un projet, une idée&nbsp;?
          </h2>
          <p class="text-muted mb-8 max-w-xl mx-auto">Discutons-en ! je réponds rapidement.</p>
          <a
            routerLink="/contact"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <app-icon name="envelope" [size]="20" />
            Me contacter
          </a>
        </div>
      </section>
    </main>
  `,
})
export class Home {
  private readonly _gateway = inject(HomeGateway);

  private readonly bundleResource = rxResource({
    stream: () => this._gateway.getHomeBundle(),
  });
  protected readonly bundle = computed(() => this.bundleResource.value());
  protected readonly expertises = computed(() => this.bundle()?.highlights ?? []);
}
