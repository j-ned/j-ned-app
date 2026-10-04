import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import type { HeroData } from '../domain/models/hero.model';

type HeadlineSegment = { readonly text: string; readonly accent: boolean };

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let h = hero();
    @if (h) {
      <h1
        class="max-w-[21ch] text-[clamp(2.25rem,5.4vw,4.4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance"
        data-testid="hero-headline"
      >
        @for (segment of headlineSegments(); track $index) {
          @if (segment.accent) {
            <em class="not-italic text-primary">{{ segment.text }}</em>
          } @else {
            <span>{{ segment.text }}</span>
          }
        }
      </h1>

      <p
        class="animate-fade-up [animation-delay:120ms] mt-6 md:mt-7 max-w-[58ch] text-lg md:text-xl leading-relaxed text-muted"
        data-testid="hero-lead"
      >
        {{ h.lead }}
      </p>

      <ng-content />
    } @else {
      <div class="space-y-6 animate-pulse" aria-hidden="true">
        <div class="h-28 md:h-40 lg:h-48 bg-foreground/5 rounded-lg max-w-4xl"></div>
        <div class="h-16 md:h-20 bg-foreground/5 rounded-lg max-w-2xl"></div>
        <div class="h-12 bg-foreground/5 rounded-lg w-48"></div>
      </div>
    }
  `,
})
export class HomeHero {
  readonly hero = input<HeroData | null>(null);

  protected readonly headlineSegments = computed<readonly HeadlineSegment[]>(() => {
    const hero = this.hero();
    if (!hero) return [];
    const { headline, headlineAccent } = hero;
    const start = headlineAccent ? headline.indexOf(headlineAccent) : -1;
    if (!headlineAccent || start < 0) return [{ text: headline, accent: false }];
    const end = start + headlineAccent.length;
    return [
      { text: headline.slice(0, start), accent: false },
      { text: headlineAccent, accent: true },
      { text: headline.slice(end), accent: false },
    ].filter((segment) => segment.text.length > 0);
  });
}
