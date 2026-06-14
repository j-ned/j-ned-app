import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { SectionScroller } from '@core/navigation/section-scroller';
import { HomeHero } from './home-hero';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import type { HeroData } from '../domain/models/hero.model';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, Button, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block pt-8 pb-12 md:pt-12 md:pb-16 px-6 overflow-hidden',
  },
  styles: `
    /* Stagger : CTAs apparaissent juste après le hero text (delay-3 = 0.24s) */
    .delay-3 {
      animation-delay: 0.24s;
    }

    .hero-ambient::before,
    .hero-ambient::after {
      content: '';
      position: absolute;
      pointer-events: none;
      border-radius: 9999px;
      filter: blur(90px);
      opacity: 0.45;
      z-index: 0;
    }

    .hero-ambient::before {
      top: 10%;
      left: 15%;
      width: 28rem;
      height: 28rem;
      background: radial-gradient(
        closest-side,
        color-mix(in srgb, var(--color-primary) 28%, transparent),
        transparent
      );
    }

    .hero-ambient::after {
      bottom: 0;
      right: 10%;
      width: 22rem;
      height: 22rem;
      background: radial-gradient(
        closest-side,
        color-mix(in srgb, var(--color-accent) 22%, transparent),
        transparent
      );
    }
  `,
  template: `
    <div class="hero-ambient absolute inset-0" aria-hidden="true"></div>

    <div class="max-w-5xl mx-auto w-full relative z-10">
      <div class="flex flex-col items-center">
        <app-home-hero [hero]="hero()" />

        <!-- CTAs : 1 primary (action principale) + 1 outlined + 1 text (hiérarchie claire) -->
        <div
          class="animate-fade-up delay-3 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 md:mt-8"
        >
          <app-button severity="primary" size="large" (click)="goToProjects()">
            Voir les projets
            <app-icon name="arrow-right" [size]="20" />
          </app-button>
          <app-button
            variant="outlined"
            severity="primary"
            size="large"
            (click)="scrollToContact()"
          >
            Me contacter
            <app-icon name="envelope" [size]="20" />
          </app-button>
          <app-button variant="text" severity="primary" (click)="goToAbout()">
            En savoir plus
            <app-icon name="arrow-right" [size]="16" />
          </app-button>
        </div>
      </div>
    </div>
  `,
})
export class HomeHeroSection {
  readonly hero = input<HeroData | null>(null);
  private readonly router = inject(Router);
  private readonly scroller = inject(SectionScroller);

  goToProjects(): void {
    void this.router.navigate(['/projects']);
  }

  scrollToContact(): void {
    this.scroller.scrollTo('contact');
  }

  goToAbout(): void {
    void this.router.navigate(['/about']);
  }
}
