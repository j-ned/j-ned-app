import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { BIOGRAPHY } from './data/about.data';

@Component({
  selector: 'app-about-journey',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div>
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-primary">
          <use href="/icons/sprite.svg#lucide-user"></use>
        </svg>
        <h2 class="text-2xl font-bold text-foreground">{{ biography().title }}</h2>
      </div>
      <div class="space-y-3">
        @for (paragraph of biography().paragraphs; track paragraph) {
          <p class="text-muted text-sm leading-relaxed">{{ paragraph }}</p>
        }
      </div>
    </div>
  `,
})
export class AboutJourney {
  protected readonly biography = signal(BIOGRAPHY);
}
