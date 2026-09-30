import { Component, input } from '@angular/core';

/**
 * Section éditoriale en deux colonnes : titre et résumé à gauche (épinglés au scroll en lg+),
 * contenu projeté à droite. Empilée sous lg.
 */
@Component({
  selector: 'app-split-section',
  host: { class: 'block' },
  template: `
    <section
      class="page-container grid gap-8 py-22 md:py-30 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16"
      [attr.aria-labelledby]="headingId()"
    >
      <header class="lg:sticky lg:top-26 lg:self-start">
        <h2 [id]="headingId()" class="section-title">{{ heading() }}</h2>
        @if (summary()) {
          <p class="mt-3 max-w-[30ch] text-[0.9375rem] text-muted">{{ summary() }}</p>
        }
      </header>
      <div>
        <ng-content />
      </div>
    </section>
  `,
})
export class SplitSection {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly summary = input<string>('');
}
