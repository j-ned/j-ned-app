import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { HomeHero } from './home-hero';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { HeroData } from '../domain/models/hero.model';

// L'id porte l'emplacement : c'est lui qui rend le taux de clic lisible côté stats.
const HERO_CTA_ID = 'home_hero_projects';
const HERO_CTA_LABEL = 'Voir les projets';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, Button, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Le hero (titre, CTA, relevé) occupe tout le premier écran sous le header (h-20),
  // contenu centré verticalement : la section des preuves commence sous le pli.
  host: {
    class: 'flex flex-col justify-center min-h-[calc(100svh-5rem)] py-12 md:py-16',
  },
  template: `
    <div class="page-container w-full">
      <app-home-hero [hero]="hero()">
        <!-- Un seul CTA : Blog, À propos et Contact sont déjà servis par la nav (NAV_LINKS). -->
        <div class="animate-fade-up [animation-delay:180ms] mt-9">
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
        <p class="animate-fade-up [animation-delay:200ms] mt-5 text-sm text-muted">
          <a
            [href]="maltUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="underline decoration-foreground/20 underline-offset-4 hover:text-primary hover:decoration-primary transition-colors"
            data-testid="hero-availability"
            >{{ availability }}</a
          >
        </p>
      </app-home-hero>
    </div>
  `,
})
export class HomeHeroSection {
  private readonly _router = inject(Router);
  private readonly _analytics = inject(AnalyticsGateway);

  readonly hero = input<HeroData | null>(null);

  protected readonly ctaLabel = HERO_CTA_LABEL;
  protected readonly availability = SITE_IDENTITY.availability;
  protected readonly maltUrl = SITE_IDENTITY.socials.malt;

  protected goToProjects(): void {
    this._analytics.trackCtaClick(HERO_CTA_ID, HERO_CTA_LABEL);
    void this._router.navigate(['/projects']);
  }
}
