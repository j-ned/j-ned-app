import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { HOME_GATEWAY } from '../../core/home/gateways';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-8 md:mb-14 text-center md:text-left min-h-70 md:min-h-80">
      @if (hero()) {
        <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
          {{ hero()!.name }}
        </h1>

        <p class="text-xl md:text-3xl font-medium text-foreground/90 mb-4 leading-relaxed">
          {{ hero()!.tagline }}
          <span class="text-primary font-semibold">{{ hero()!.technologies[0] }}</span>
          et
          <span class="text-primary font-semibold">{{ hero()!.technologies[1] }}</span>
        </p>

        <p class="text-lg md:text-xl text-muted max-w-3xl leading-relaxed mx-auto md:mx-0">
          {{ hero()!.description }}
        </p>
      }
    </div>
  `,
})
export class HomeHero {
  private homeGateway = inject(HOME_GATEWAY);
  private heroResource = this.homeGateway.getHeroData();
  protected readonly hero = computed(() => this.heroResource.value());
}
