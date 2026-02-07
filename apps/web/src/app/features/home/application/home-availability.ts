import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { HOME_GATEWAY } from '../domain/gateways';

@Component({
  selector: 'app-home-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hero()) {
      <div class="flex items-center gap-3 text-base justify-center lg:justify-start">
        <div class="relative flex h-3 w-3">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </div>
        <span class="text-muted font-medium">
          {{ hero()!.availability }}
        </span>
      </div>
    }
  `,
})
export class HomeAvailability {
  private homeGateway = inject(HOME_GATEWAY);
  private heroResource = this.homeGateway.getHeroData();
  protected readonly hero = computed(() => this.heroResource.value());
}
