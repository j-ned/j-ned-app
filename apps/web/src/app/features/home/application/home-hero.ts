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

    @keyframes fade-up {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-up {
      animation: fade-up 0.4s ease-out both;
      will-change: transform, opacity;
    }

    .delay-1 {
      animation-delay: 0.05s;
    }
    .delay-2 {
      animation-delay: 0.1s;
    }
  `,
  template: `
    <hgroup class="text-center min-h-[180px] md:min-h-[220px] lg:min-h-[260px]">
      @if (hero()) {
        <div class="animate-fade-up flex flex-wrap items-center justify-center gap-3 mb-4 md:mb-6">
          <span class="text-sm md:text-base font-medium text-primary/80 tracking-widest uppercase">
            Freelance Full-Stack
          </span>
          <app-home-availability [hero]="hero()" />
        </div>

        <h1
          class="animate-fade-up delay-1 name-gradient text-5xl md:text-7xl lg:text-8xl font-extrabold mb-5 md:mb-7 tracking-tight leading-[1.2] py-2"
        >
          {{ hero()!.name }}
        </h1>

        <p
          class="animate-fade-up delay-2 text-lg md:text-2xl lg:text-3xl font-medium text-foreground/70 leading-relaxed max-w-3xl mx-auto [&>.kw]:text-primary [&>.kw]:font-semibold"
          [innerHTML]="highlightedTagline()"
        ></p>
      } @else {
        <div class="space-y-5 animate-pulse flex flex-col items-center">
          <div class="h-5 bg-foreground/5 rounded-full w-40"></div>
          <div class="h-12 md:h-16 lg:h-20 bg-foreground/5 rounded-lg w-3/4"></div>
          <div class="h-7 md:h-9 bg-foreground/5 rounded-lg w-full max-w-2xl"></div>
        </div>
      }
    </hgroup>
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
