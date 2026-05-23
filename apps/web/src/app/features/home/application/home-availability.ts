import { Component, ChangeDetectionStrategy, input } from '@angular/core';

type HeroData = { availability: string };

@Component({
  selector: 'app-home-availability',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  styles: `
    @keyframes ping-once {
      0% {
        transform: scale(1);
        opacity: 0.75;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    .ping-once {
      animation: ping-once 1s ease-out 0.3s 3 both;
    }
  `,
  template: `
    @if (hero()) {
      <p
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-status-success/20 bg-status-success/5 text-xs"
      >
        <span class="relative flex h-2 w-2" aria-hidden="true">
          <span
            class="ping-once absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
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
