import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from './tokens';

@Component({
  selector: 'app-home-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (hero()) {
      <p
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 text-xs"
      >
        <span class="relative flex h-2 w-2" aria-hidden="true">
          <span
            class="animate-ping will-change-[transform,opacity] absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span class="text-muted font-medium">
          {{ hero()!.availability }}
        </span>
      </p>
    }
  `,
})
export class HomeAvailability {
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly heroResource = rxResource({
    stream: () => this.homeGateway.getHeroData(),
  });
  protected readonly hero = computed(() => this.heroResource.value());
}
