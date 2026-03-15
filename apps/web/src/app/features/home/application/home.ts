import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeHeroSection } from './home-hero-section';
import { HomeServices } from './home-services';
import { HomeProjects } from './home-projects';
import { HomeTechStack } from './home-tech-stack';
import { HomeBlog } from './home-blog';
import { HomeContactCta } from './home-contact-cta';
import { HOME_GATEWAY } from './tokens';
import { SiteSettingsService } from '@core/services';

@Component({
  selector: 'app-home',
  imports: [HomeHeroSection, HomeServices, HomeProjects, HomeTechStack, HomeBlog, HomeContactCta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="flex flex-col w-full">
      <!-- Hero Section -->
      <app-home-hero-section />

      <!-- Expertise Section -->
      @if (expertises().length > 0) {
        <section class="w-full py-6 md:py-10">
          <div class="max-w-7xl mx-auto px-6">
            <ul class="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
              @for (item of expertises(); track item.id) {
                <li
                  class="group relative p-6 rounded-xl border border-foreground/8 bg-foreground/[0.02] hover:border-primary/25 hover:bg-foreground/[0.04] transition-all duration-300"
                >
                  <div class="flex items-center gap-3 mb-4">
                    <div
                      class="w-11 h-11 shrink-0 rounded-xl bg-linear-to-br from-primary-bg/15 to-accent/15 flex items-center justify-center group-hover:from-primary-bg/25 group-hover:to-accent/25 transition-colors duration-300"
                    >
                      <svg aria-hidden="true" class="w-5 h-5 text-primary">
                        <use [attr.href]="'/icons/sprite.svg#' + item.icon"></use>
                      </svg>
                    </div>
                    <h3
                      class="text-sm font-bold text-primary uppercase tracking-widest"
                    >
                      {{ item.title }}
                    </h3>
                  </div>
                  <p class="text-sm text-muted leading-relaxed">
                    {{ item.description }}
                  </p>
                </li>
              }
            </ul>
          </div>
        </section>
      }

      <!-- Services Section -->
      @defer (on viewport) {
        <section class="w-full py-12 md:py-16">
          <div class="max-w-7xl mx-auto px-6">
            <app-home-services />
          </div>
        </section>
      } @placeholder {
        <div class="block py-12 px-6 h-64"></div>
      }

      <!-- Projects Section -->
      @defer (on viewport) {
        <section class="w-full py-12 md:py-16">
          <div class="max-w-7xl mx-auto px-6">
            <app-home-projects />
          </div>
        </section>
      } @placeholder {
        <div class="block py-12 px-6 h-64"></div>
      }

      <!-- Tech Stack Section -->
      @defer (on viewport) {
        <section class="w-full py-12 md:py-16">
          <div class="max-w-7xl mx-auto px-6">
            <app-home-tech-stack />
          </div>
        </section>
      } @placeholder {
        <div class="block py-12 px-6 h-64"></div>
      }

      <!-- Blog Section -->
      @if (siteSettings.blogEnabled()) {
        @defer (on viewport) {
          <section class="w-full py-12 md:py-16">
            <div class="max-w-7xl mx-auto px-6">
              <app-home-blog />
            </div>
          </section>
        } @placeholder {
          <div class="block py-12 px-6 h-64"></div>
        }
      }

      <!-- Contact CTA Section -->
      @defer (on viewport) {
        <section class="w-full py-12 md:py-16">
          <div class="max-w-7xl mx-auto px-6">
            <app-home-contact-cta />
          </div>
        </section>
      } @placeholder {
        <div class="block py-12 px-6 h-64"></div>
      }
    </main>
  `,
})
export class Home {
  private readonly document = inject(DOCUMENT);
  private readonly homeGateway = inject(HOME_GATEWAY);
  protected readonly siteSettings = inject(SiteSettingsService);

  protected readonly expertises = toSignal(this.homeGateway.getHomeHighlights(), {
    initialValue: [],
  });

  scrollTo(anchor: string): void {
    const el = this.document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
