import { Component } from '@angular/core';
import { AboutHero } from '../../application/about-hero';
import { AboutDiploma } from '../../application/about-diploma';
import { AboutJourney } from '../../application/about-journey';
import { AboutWhatIDo } from '../../application/about-what-i-do';
import { AboutHighlights } from '../../application/about-highlights';
import { AboutMotivation } from '../../application/about-motivation';
import { AboutHiring } from '../../application/about-hiring';

// Le bloc recrutement reste hors @defer : l'ancre #recrutement doit exister au premier rendu.
@Component({
  selector: 'app-about',
  host: { class: 'block min-h-svh pt-20' },
  imports: [
    AboutHero,
    AboutJourney,
    AboutHighlights,
    AboutWhatIDo,
    AboutDiploma,
    AboutHiring,
    AboutMotivation,
  ],
  template: `
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

    <app-about-hiring />

    @defer (hydrate on viewport) {
      <app-about-motivation />
    } @placeholder {
      <div class="h-[30rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }
  `,
})
export class About {}
