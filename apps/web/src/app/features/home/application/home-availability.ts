import { Component, ChangeDetectionStrategy, input } from '@angular/core';

type HeroData = { availability: string };

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
          {{ hero()?.availability }}
        </span>
      </p>
    }
  `,
})
export class HomeAvailability {
  readonly hero = input<HeroData | null | undefined>(null);
}
