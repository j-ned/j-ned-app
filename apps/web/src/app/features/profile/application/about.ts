import { Component } from '@angular/core';
import { AboutHero } from './about-hero';
import { AboutDiploma } from './about-diploma';
import { AboutJourney } from './about-journey';
import { AboutWhatIDo } from './about-what-i-do';
import { AboutHighlights } from './about-highlights';
import { AboutMotivation } from './about-motivation';

// Page en lecture continue : hero, parcours, traits, travail + stack, formations, conclusion.
// Seul le hero est rendu d'emblée ; les sections sous le pli s'hydratent à l'approche.
@Component({
  selector: 'app-about',
  host: { class: 'block' },
  imports: [AboutHero, AboutJourney, AboutHighlights, AboutWhatIDo, AboutDiploma, AboutMotivation],
  template: `
    <main class="min-h-svh pt-20">
      <app-about-hero />

      @defer (hydrate on viewport) {
        <app-about-journey />
      } @placeholder {
        <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
      } @error {
        <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
      }

      @defer (hydrate on viewport) {
        <app-about-highlights />
      } @placeholder {
        <div class="h-[28rem] border-t border-foreground/8" aria-hidden="true"></div>
      } @error {
        <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
      }

      @defer (hydrate on viewport) {
        <app-about-what-i-do />
      } @placeholder {
        <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
      } @error {
        <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
      }

      @defer (hydrate on viewport) {
        <app-about-diploma />
      } @placeholder {
        <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
      } @error {
        <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
      }

      @defer (hydrate on viewport) {
        <app-about-motivation />
      } @placeholder {
        <div class="h-[30rem] border-t border-foreground/8" aria-hidden="true"></div>
      } @error {
        <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
      }
    </main>
  `,
})
export class About {}
