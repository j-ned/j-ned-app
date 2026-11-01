import { Component, input } from '@angular/core';
import type { Highlight } from '@features/profile/domain/models/highlight.model';

@Component({
  selector: 'app-about-highlights',
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <section class="page-container py-22 md:py-30" aria-labelledby="traits-heading">
      <h2 id="traits-heading" class="section-title">Ce qui me caractérise</h2>
      <ul class="mt-12 grid lg:grid-cols-3 lg:gap-10" role="list">
        @for (highlight of highlights(); track highlight.id) {
          <li class="border-t-2 border-foreground pt-5 pb-7" data-testid="about-trait">
            <h3 class="text-xl font-semibold tracking-tight">{{ highlight.title }}</h3>
            <p class="mt-2.5 text-[0.96875rem] leading-relaxed text-muted">
              {{ highlight.description }}
            </p>
          </li>
        }
      </ul>
    </section>
  `,
})
export class AboutHighlights {
  readonly highlights = input.required<readonly Highlight[]>();
}
