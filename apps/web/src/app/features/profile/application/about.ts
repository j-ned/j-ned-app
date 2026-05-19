import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutHero } from './about-hero';
import { AboutStack } from './about-stack';
import { AboutSearch } from './about-search';
import { AboutDiploma } from './about-diploma';
import { AboutJourney } from './about-journey';
import { AboutWhatIDo } from './about-what-i-do';
import { AboutHighlights } from './about-highlights';

@Component({
  selector: 'app-about',
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
    <main
      class="min-h-screen pt-20 pb-16 bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg h-full"
    >
      <section class="relative mb-10">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <app-about-hero />
            </div>
            <div class="lg:col-span-1">
              <app-about-stack />
            </div>
          </div>
        </div>
      </section>

      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <aside class="lg:col-span-1 space-y-8">
            @defer (hydrate on viewport) {
              <app-about-search />
            }
            @defer (hydrate on viewport) {
              <app-about-diploma />
            }
          </aside>

          <div class="lg:col-span-2 space-y-8">
            <div
              class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg space-y-8"
            >
              @defer (hydrate on viewport) {
                <app-about-journey />
              }
              <div class="border-t border-foreground/10"></div>
              @defer (hydrate on viewport) {
                <app-about-what-i-do />
              }
              <div class="border-t border-foreground/10"></div>
              @defer (hydrate on viewport) {
                <app-about-highlights />
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class About {}
