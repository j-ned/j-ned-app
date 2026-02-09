import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { HOME_GATEWAY } from '../domain';

@Component({
  selector: 'app-home-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (hero()) {
      <p class="flex items-center gap-3 text-base justify-center lg:justify-start">
        <span class="relative flex h-3 w-3" aria-hidden="true">
          <span
            class="animate-ping will-change-transform absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span class="text-muted font-medium">
          {{ hero()!.availability }}
        </span>
      </p>
    }
  `,
})
export class HomeAvailability {
  private homeGateway = inject(HOME_GATEWAY);
  private heroResource = this.homeGateway.getHeroData();
  protected readonly hero = computed(() => this.heroResource.value());
}
