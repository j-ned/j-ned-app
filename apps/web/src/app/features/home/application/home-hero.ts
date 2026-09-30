import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import type { HeroData } from '../domain/models/hero.model';

const HERO_KEYWORDS = /(Angular|NestJS)/g;

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let h = hero();
    @if (h) {
      <h1
        class="animate-fade-up [animation-delay:60ms] max-w-[21ch] text-[clamp(2.25rem,5.4vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance"
        data-testid="hero-headline"
      >
        @for (segment of headlineSegments(); track $index) {
          <span
            [class.text-primary]="segment.keyword"
            [attr.data-testid]="segment.keyword ? 'hero-keyword' : null"
            >{{ segment.text }}</span
          >
        }
      </h1>

      <p
        class="animate-fade-up [animation-delay:120ms] mt-6 md:mt-7 max-w-[58ch] text-lg md:text-xl leading-relaxed text-muted"
        data-testid="hero-lead"
      >
        {{ h.lead }}
      </p>

      <ng-content />

      <dl
        class="animate-fade-up [animation-delay:240ms] mt-14 md:mt-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border-y border-foreground/8 bg-foreground/8"
        aria-label="Relevé technique de ce site"
      >
        @for (proof of h.proofs; track proof.label) {
          <div
            class="flex flex-col gap-1.5 bg-background py-5 pr-6 sm:even:pl-6 lg:nth-[n+2]:pl-6"
            data-testid="hero-proof"
          >
            <dt class="font-mono text-xs text-muted">{{ proof.label }}</dt>
            <dd class="text-base md:text-[1.0625rem] font-semibold tracking-tight">
              {{ proof.value }}
            </dd>
            <dd class="font-mono text-xs text-primary">{{ proof.detail }}</dd>
          </div>
        }
      </dl>
    } @else {
      <div class="space-y-6 animate-pulse" aria-hidden="true">
        <div class="h-28 md:h-40 lg:h-48 bg-foreground/5 rounded-lg max-w-4xl"></div>
        <div class="h-16 md:h-20 bg-foreground/5 rounded-lg max-w-2xl"></div>
        <div class="h-12 bg-foreground/5 rounded-lg w-48"></div>
        <div class="h-24 bg-foreground/5 rounded-lg mt-14 md:mt-18"></div>
      </div>
    }
  `,
})
export class HomeHero {
  readonly hero = input<HeroData | null>(null);

  protected readonly headlineSegments = computed<readonly { text: string; keyword: boolean }[]>(
    () => {
      const headline = this.hero()?.headline;
      if (!headline) return [];
      return headline
        .split(HERO_KEYWORDS)
        .filter((part) => part.length > 0)
        .map((part) => ({ text: part, keyword: part === 'Angular' || part === 'NestJS' }));
    },
  );
}
