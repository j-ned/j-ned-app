import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HomeAvailability } from './home-availability';
import { HOME_GATEWAY } from './tokens';

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
      filter: drop-shadow(0 0 1px var(--color-primary)) drop-shadow(0 0 1px var(--color-primary));
    }

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

    .animate-fade-up {
      animation: fade-up 0.6s ease-out both;
    }

    .delay-1 {
      animation-delay: 0.1s;
    }
    .delay-2 {
      animation-delay: 0.25s;
    }
  `,
  template: `
    <hgroup class="text-center">
      @if (hero()) {
        <div class="animate-fade-up flex flex-wrap items-center justify-center gap-3 mb-4 md:mb-6">
          <span class="text-sm md:text-base font-medium text-primary/80 tracking-widest uppercase">
            Freelance Full-Stack
          </span>
          <app-home-availability />
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
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly heroResource = rxResource({
    stream: () => this.homeGateway.getHeroData(),
  });
  protected readonly hero = computed(() => this.heroResource.value());

  protected readonly highlightedTagline = computed(() => {
    const tagline = this.hero()?.tagline;
    if (!tagline) return '';
    return tagline.replace(/(Angular|NestJS)/g, '<span class="kw">$1</span>');
  });
}
