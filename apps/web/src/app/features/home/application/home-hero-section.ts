import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { HomeHero } from './home-hero';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import type { HeroData } from '../domain/models/hero.model';

// L'id porte l'emplacement : c'est lui qui rend le taux de clic lisible côté stats.
const HERO_CTA_ID = 'home_hero_projects';
const HERO_CTA_LABEL = 'Voir les projets';

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

        <!-- Un seul CTA : Blog, À propos et Contact sont déjà servis par la nav (NAV_LINKS). -->
        <div class="animate-fade-up delay-3 mt-6 md:mt-8">
          <app-button
            severity="primary"
            size="large"
            data-testid="hero-cta-projects"
            (click)="goToProjects()"
          >
            {{ ctaLabel }}
            <app-icon name="arrow-right" [size]="20" />
          </app-button>
        </div>
      </div>
    </div>
  `,
})
export class HomeHeroSection {
  private readonly _router = inject(Router);
  private readonly _analytics = inject(AnalyticsGateway);

  readonly hero = input<HeroData | null>(null);

  protected readonly ctaLabel = HERO_CTA_LABEL;

  protected goToProjects(): void {
    this._analytics.trackCtaClick(HERO_CTA_ID, HERO_CTA_LABEL);
    void this._router.navigate(['/projects']);
  }
}
