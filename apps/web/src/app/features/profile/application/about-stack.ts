import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { Technology } from '@features/profile/domain/models/technology.model';

// Filets entre cellules par `gap-px` sur fond de bordure : aucun double trait, quel que soit
// le nombre de colonnes (2, 3 ou 6).
@Component({
  selector: 'app-about-stack',
  imports: [NgOptimizedImage],
  host: { class: 'block' },
  template: `
    <ul
      class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-foreground/8 bg-foreground/8 sm:grid-cols-3 xl:grid-cols-6"
      aria-label="Stack technique"
      role="list"
    >
      @for (tech of technologies(); track tech.id) {
        <li class="flex items-center gap-3 bg-background px-5 py-4.5" data-testid="about-tech">
          <img
            [ngSrc]="'/icons/' + tech.icon + '.svg'"
            alt=""
            width="32"
            height="32"
            class="size-7 shrink-0"
          />
          <div class="min-w-0">
            <p class="text-[0.90625rem] font-semibold leading-tight">{{ tech.name }}</p>
            <p class="font-mono text-[0.71875rem] lowercase text-muted">{{ tech.category }}</p>
          </div>
        </li>
      }
    </ul>
  `,
})
export class AboutStack {
  readonly technologies = input.required<readonly Technology[]>();
}
