import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HomeHero } from './home-hero';
import { UiButton } from '@shared/ui';
import type { HeroData } from '../domain';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block pt-6 pb-8 md:pt-8 md:pb-10 px-6 overflow-hidden',
  },
  styles: `
    @keyframes fade-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-up-actions {
      animation: fade-up 0.4s ease-out 0.12s both;
      will-change: transform, opacity;
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
      background: radial-gradient(closest-side, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent);
    }
    .hero-ambient::after {
      bottom: 0;
      right: 10%;
      width: 22rem;
      height: 22rem;
      background: radial-gradient(closest-side, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent);
    }

    /* En light, les blobs deviennent trop saturés sur fond crème → adoucir */
    :root:not(.app-dark) .hero-ambient::before,
    :root:not(.app-dark) .hero-ambient::after {
      opacity: 0.22;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-fade-up-actions {
        animation: none;
      }
    }
  `,
  template: `
    <div class="hero-ambient absolute inset-0" aria-hidden="true"></div>

    <div class="max-w-5xl mx-auto w-full relative z-10">
      <div class="flex flex-col items-center">
        <app-home-hero [hero]="hero()" />

        <!-- CTAs -->
        <div
          class="animate-fade-up-actions flex flex-col sm:flex-row items-center gap-4 mt-6 md:mt-8"
        >
          <app-ui-button severity="primary" size="large" (click)="goToProjects()">
            Voir mes réalisations
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
          </app-ui-button>
          <app-ui-button
            variant="outlined"
            severity="secondary"
            size="large"
            (click)="goToContact()"
          >
            Me contacter
            <i class="pi pi-envelope" aria-hidden="true"></i>
          </app-ui-button>
        </div>
      </div>
    </div>
  `,
})
export class HomeHeroSection {
  readonly hero = input<HeroData | null>(null);
  private readonly router = inject(Router);

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }

  goToContact(): void {
    this.router.navigate(['/contact']);
  }
}
