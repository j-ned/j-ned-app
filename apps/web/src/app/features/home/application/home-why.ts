import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { KeyPointList } from '@shared/ui/key-point-list';
import { HOME_WHY } from '../domain/home-pitch.static-data';

@Component({
  selector: 'app-home-why',
  imports: [AppIcon, KeyPointList, RouterLink],
  host: { class: 'block' },
  template: `
    <section
      class="page-container grid gap-12 py-24 md:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start lg:gap-16"
      aria-labelledby="home-why-heading"
      data-testid="home-why"
    >
      <div>
        <h2 id="home-why-heading" class="section-title mb-10">{{ why.heading }}</h2>
        <figure>
          <blockquote
            class="font-display text-[clamp(1.5rem,2.6vw,2.05rem)] font-semibold leading-[1.22] tracking-[-0.015em] text-balance font-stretch-104%"
            data-testid="home-why-quote"
          >
            <p>
              «&nbsp;<span data-testid="home-why-quote-text">{{ why.quote.text }}</span
              >&nbsp;»
            </p>
          </blockquote>
          <figcaption
            class="mt-6 font-mono text-[0.8125rem] text-muted"
            data-testid="home-why-quote-attribution"
          >
            {{ why.quote.attribution }}
          </figcaption>
        </figure>
      </div>
      <div>
        <app-key-point-list [points]="why.points" />
        <a
          routerLink="/about"
          class="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline"
          data-testid="home-why-about-link"
          >{{ why.aboutLinkLabel }}<app-icon name="arrow-right" [size]="16"
        /></a>
      </div>
    </section>
  `,
})
export class HomeWhy {
  protected readonly why = HOME_WHY;
}
