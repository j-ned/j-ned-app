import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HomeHero } from './home-hero';
import { ButtonComponent } from '@layout';
import type { HeroData } from '../domain';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block pt-28 pb-12 md:pt-36 md:pb-16 px-6 overflow-hidden',
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
  `,
  template: `
    <div class="max-w-5xl mx-auto w-full relative z-10">
      <div class="flex flex-col items-center">
        <app-home-hero [hero]="hero()" />

        <!-- CTAs -->
        <div
          class="animate-fade-up-actions flex flex-col sm:flex-row items-center gap-4 mt-10 md:mt-12"
        >
          <app-button variant="primary" size="lg" radius="md" (clicked)="goToProjects()">
            Voir mes réalisations
            <svg aria-hidden="true" class="w-5 h-5 ml-2">
              <use href="/icons/sprite.svg#lucide-arrow-right"></use>
            </svg>
          </app-button>
          <app-button variant="accent" size="lg" radius="md" (clicked)="goToContact()">
            Me contacter
            <svg aria-hidden="true" class="w-5 h-5 ml-2">
              <use href="/icons/sprite.svg#lucide-mail"></use>
            </svg>
          </app-button>
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
