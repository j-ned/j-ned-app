import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { Button } from '@shared/ui/button';
import { Cartouche } from '@shared/ui/cartouche';
import { DimensionLine } from '@shared/ui/dimension-line';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from '../domain/home-hero.static-data';
import type { HeroData } from '../domain/models/hero.model';
import { HomeHero } from './home-hero';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, Button, Cartouche, DimensionLine, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Le hero occupe tout le premier écran sous le header (h-20) : les offres commencent sous le pli.
  host: {
    class: 'flex flex-col justify-center min-h-[calc(100svh-5rem)] py-12 md:py-16',
  },
  template: `
    <div
      class="page-container grid w-full items-end gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-16"
    >
      <app-home-hero [hero]="hero()">
        <div class="animate-fade-up [animation-delay:180ms] mt-9 flex flex-wrap items-center gap-3">
          <app-button data-testid="hero-cta-contact" (click)="describeProject()">
            {{ ctaLabels.contact }}
          </app-button>
          <a
            routerLink="/offres"
            class="link-btn-outline"
            data-testid="hero-cta-offers"
            (click)="trackOffersClick()"
            >{{ ctaLabels.offers }}</a
          >
        </div>
        <p
          class="animate-fade-up [animation-delay:200ms] mt-5 flex items-center gap-2.5 text-sm text-muted"
          data-testid="hero-availability"
        >
          <span
            class="size-2 shrink-0 rounded-full bg-status-success ring-4 ring-status-success/20"
            aria-hidden="true"
          ></span>
          {{ availability }}
        </p>
      </app-home-hero>

      <div>
        <app-cartouche
          data-testid="hero-work-frame"
          [title]="workFrame.title"
          [reference]="workFrame.reference"
          [rows]="workFrame.rows"
        />
        <app-dimension-line
          class="mt-3.5"
          data-testid="hero-work-frame-dimension"
          [label]="workFrame.dimension"
        />
      </div>
    </div>
  `,
})
export class HomeHeroSection {
  private readonly _scroller = inject(SectionScroller);
  private readonly _analytics = inject(AnalyticsGateway);

  readonly hero = input<HeroData | null>(null);

  protected readonly ctaLabels = HOME_HERO_CTA_LABELS;
  protected readonly availability = SITE_IDENTITY.availability;
  protected readonly workFrame = HOME_WORK_FRAME;

  protected describeProject(): void {
    this._analytics.trackCtaClick('home_hero_contact', HOME_HERO_CTA_LABELS.contact);
    this._scroller.scrollTo('contact');
  }

  protected trackOffersClick(): void {
    this._analytics.trackCtaClick('home_hero_offers', HOME_HERO_CTA_LABELS.offers);
  }
}
