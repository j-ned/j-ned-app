import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@shared/ui/button';
import { Cartouche } from '@shared/ui/cartouche';
import { DimensionLine } from '@shared/ui/dimension-line';
import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from '../domain/home-hero.static-data';
import type { HeroData } from '../domain/models/hero.model';
import { HomeHero } from './home-hero';

@Component({
  selector: 'app-home-hero-section',
  imports: [HomeHero, Button, Cartouche, DimensionLine, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Le hero occupe tout le premier écran sous le header (h-20) : les articles commencent sous le pli.
  host: {
    class: 'flex flex-col justify-center min-h-[calc(100svh-5rem)] py-12 md:py-16',
  },
  template: `
    <div
      class="page-container grid w-full items-end gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-16"
    >
      <app-home-hero [hero]="hero()">
        <div class="animate-fade-up [animation-delay:180ms] mt-9 flex flex-wrap items-center gap-3">
          <a appButton routerLink="/blog" data-testid="hero-cta-blog" (click)="blogOpened.emit()">{{
            ctaLabels.blog
          }}</a>
          <a
            appButton
            variant="outlined"
            routerLink="/projects"
            data-testid="hero-cta-projects"
            (click)="projectsOpened.emit()"
            >{{ ctaLabels.projects }}</a
          >
        </div>
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
  readonly hero = input<HeroData | null>(null);
  readonly blogOpened = output<void>();
  readonly projectsOpened = output<void>();

  protected readonly ctaLabels = HOME_HERO_CTA_LABELS;
  protected readonly workFrame = HOME_WORK_FRAME;
}
