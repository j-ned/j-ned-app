import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutHero } from './about-hero';
import { AboutStack } from './about-stack';
import { AboutSearch } from './about-search';
import { AboutDiploma } from './about-diploma';
import { AboutJourney } from './about-journey';
import { AboutWhatIDo } from './about-what-i-do';
import { AboutHighlights } from './about-highlights';

@Component({
  selector: 'about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [
    AboutHero,
    AboutStack,
    AboutSearch,
    AboutDiploma,
    AboutJourney,
    AboutWhatIDo,
    AboutHighlights,
  ],
  template: `
    <main class="min-h-svh pt-20 pb-16">
      <section class="page-container mb-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
          <div class="lg:col-span-2">
            <about-hero />
          </div>
          <div class="lg:col-span-1">
            <about-stack />
          </div>
        </div>
      </section>

      <div class="page-container">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <aside class="lg:col-span-1 space-y-8">
            @defer (hydrate on viewport) {
              <about-search />
            } @placeholder {
              <div class="h-48" aria-hidden="true"></div>
            } @error {
              <p class="text-sm text-muted">Section indisponible.</p>
            }
            @defer (hydrate on viewport) {
              <about-diploma />
            } @placeholder {
              <div class="h-96" aria-hidden="true"></div>
            } @error {
              <p class="text-sm text-muted">Section indisponible.</p>
            }
          </aside>

          <div class="lg:col-span-2 space-y-8">
            @defer (hydrate on viewport) {
              <about-journey />
            } @placeholder {
              <div class="h-64" aria-hidden="true"></div>
            } @error {
              <p class="text-sm text-muted">Section indisponible.</p>
            }
            @defer (hydrate on viewport) {
              <about-what-i-do />
            } @placeholder {
              <div class="h-64" aria-hidden="true"></div>
            } @error {
              <p class="text-sm text-muted">Section indisponible.</p>
            }
            @defer (hydrate on viewport) {
              <about-highlights />
            } @placeholder {
              <div class="h-64" aria-hidden="true"></div>
            } @error {
              <p class="text-sm text-muted">Section indisponible.</p>
            }
          </div>
        </div>
      </div>
    </main>
  `,
})
export class About {}
