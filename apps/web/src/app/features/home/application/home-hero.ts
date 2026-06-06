import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { HomeAvailability } from './home-availability';
import type { HeroData } from '../domain';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HomeAvailability],
  host: { class: 'block' },
  styles: `
    .name-gradient {
      background: linear-gradient(135deg, var(--color-foreground) 30%, var(--color-primary) 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    /* Stagger delays for the hero entrance sequence (animation defined globally in styles.css) */
    .delay-1 {
      animation-delay: 0.08s;
    }
    .delay-2 {
      animation-delay: 0.16s;
    }
  `,
  template: `
    <div class="text-center min-h-55 md:min-h-70 lg:min-h-80">
      @let h = hero();
      @if (h) {
        <div class="animate-fade-up flex flex-wrap items-center justify-center gap-3 mb-3 md:mb-4">
          <app-home-availability [hero]="h" />
        </div>

        <h1
          class="animate-fade-up delay-1 name-gradient text-5xl md:text-7xl lg:text-8xl font-extrabold mb-3 md:mb-4 tracking-tight leading-[1.2] pb-1"
        >
          {{ h.name }}
        </h1>

        <p
          class="animate-fade-up delay-2 text-lg md:text-2xl lg:text-3xl font-medium text-foreground/70 leading-snug max-w-3xl mx-auto [&>.kw]:text-primary [&>.kw]:font-semibold"
          [innerHTML]="highlightedTagline()"
        ></p>
      } @else {
        <div class="space-y-4 animate-pulse flex flex-col items-center">
          <div class="h-6 bg-foreground/5 rounded-full w-48"></div>
          <div class="h-14 md:h-20 lg:h-28 bg-foreground/5 rounded-lg w-3/4"></div>
          <div class="h-20 md:h-28 lg:h-32 bg-foreground/5 rounded-lg w-full max-w-2xl"></div>
        </div>
      }
    </div>
  `,
})
export class HomeHero {
  readonly hero = input<HeroData | null>(null);

  protected readonly highlightedTagline = computed(() => {
    const tagline = this.hero()?.tagline;
    if (!tagline) return '';
    return tagline.replace(/(Angular|NestJS)/g, '<span class="kw">$1</span>');
  });
}
