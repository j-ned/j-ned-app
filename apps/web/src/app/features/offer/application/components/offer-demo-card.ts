import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { demoPicture } from '@features/offer/domain/demo-picture';
import type { OfferDemo } from '@features/offer/domain/models/offer.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Cartouche } from '@shared/ui/cartouche';

const DEMO_IMAGE_SIZES =
  '(min-width: 80rem) 54rem, (min-width: 64rem) calc(100vw - 26rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)';

@Component({
  selector: 'app-offer-demo-card',
  imports: [Cartouche, NgOptimizedImage, AppIcon],
  host: { class: 'block' },
  template: `
    <app-cartouche [title]="demo().name" [reference]="demo().sector">
      <div class="relative">
        <span
          data-testid="offer-demo-badge"
          class="absolute left-3 top-3 rounded-sm border border-line-strong bg-background px-2 py-1 font-mono text-xs uppercase tracking-[0.06em] text-foreground"
        >
          Démo
        </span>
        <picture>
          <source
            type="image/avif"
            [attr.srcset]="picture().avifSrcset"
            [attr.sizes]="sizes"
            data-testid="offer-demo-source-avif"
          />
          <source
            type="image/webp"
            [attr.srcset]="picture().webpSrcset"
            [attr.sizes]="sizes"
            data-testid="offer-demo-source-webp"
          />
          <img
            [ngSrc]="picture().fallbackSrc"
            [width]="picture().width"
            [height]="picture().height"
            [alt]="demo().image.alt"
            class="block h-auto w-full"
            data-testid="offer-demo-image"
          />
        </picture>
      </div>
      <div class="grid gap-3 border-t border-line p-3.5">
        <p data-testid="offer-demo-illustrates" class="text-base leading-snug">
          {{ demo().illustrates }}
        </p>
        <a
          [href]="demo().url"
          target="_blank"
          rel="noopener"
          class="link-btn-outline justify-self-start"
          data-testid="offer-demo-link"
        >
          Voir la démo<span class="sr-only">&nbsp;: {{ demo().name }}, nouvel onglet</span>
          <app-icon name="external-link" [size]="14" />
        </a>
      </div>
    </app-cartouche>
  `,
})
export class OfferDemoCard {
  readonly demo = input.required<OfferDemo>();
  protected readonly picture = computed(() => demoPicture(this.demo().image.file));
  protected readonly sizes = DEMO_IMAGE_SIZES;
}
