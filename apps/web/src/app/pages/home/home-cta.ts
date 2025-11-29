import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button';

@Component({
  selector: 'app-home-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-stretch">
      <app-button variant="primary" size="lg" radius="md" (clicked)="scrollTo('projects')">
        Voir mes réalisations
        <svg class="w-5 h-5">
          <use href="/icons/sprite.svg#lucide-arrow-right"></use>
        </svg>
      </app-button>
      <app-button variant="accent" size="lg" radius="md" (clicked)="scrollTo('contact')">
        Me contacter
        <svg class="w-5 h-5">
          <use href="/icons/sprite.svg#lucide-mail"></use>
        </svg>
      </app-button>
    </div>
  `,
  imports: [ButtonComponent],
})
export class HomeCta {
  private readonly document = inject(DOCUMENT);

  scrollTo(anchor: string) {
    const el = this.document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
