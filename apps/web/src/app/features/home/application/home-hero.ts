import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { HOME_GATEWAY } from '../domain';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <hgroup class="mb-8 md:mb-14 text-center md:text-left min-h-70 md:min-h-80">
      @if (hero()) {
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
          {{ hero()!.name }}
        </h1>

        <p class="text-xl md:text-3xl font-medium text-foreground/90 mb-4 leading-relaxed">
          {{ hero()!.tagline }}
          <strong class="text-primary font-semibold">{{ hero()!.technologies[0] }}</strong>
          et
          <strong class="text-primary font-semibold">{{ hero()!.technologies[1] }}</strong>
        </p>

        <p class="text-lg md:text-xl text-muted max-w-3xl leading-relaxed mx-auto md:mx-0">
          {{ hero()!.description }}
        </p>
      } @else {
        <div class="space-y-6 animate-pulse">
          <div class="h-12 md:h-18 lg:h-24 bg-foreground/5 rounded-lg w-3/4"></div>
          <div class="h-14 md:h-20 bg-foreground/5 rounded-lg w-full max-w-xl"></div>
          <div class="h-7 md:h-8 bg-foreground/5 rounded-lg w-full max-w-3xl"></div>
        </div>
      }
    </hgroup>
  `,
})
export class HomeHero {
  private homeGateway = inject(HOME_GATEWAY);
  private heroResource = this.homeGateway.getHeroData();
  protected readonly hero = computed(() => this.heroResource.value());
}
