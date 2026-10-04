import { Component, computed, input } from '@angular/core';

type FaqItem = { readonly id: string; readonly question: string; readonly answer: string };

@Component({
  selector: 'app-faq-list',
  host: { class: 'block' },
  template: `
    <section class="page-container py-24 md:py-32" [attr.aria-labelledby]="headingId()">
      <header class="mb-12 grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2 [id]="headingId()" class="section-title">{{ heading() }}</h2>
        @if (lead()) {
          <p class="max-w-[52ch] text-muted" data-testid="faq-lead">{{ lead() }}</p>
        }
      </header>
      <div class="grid lg:grid-cols-2 lg:gap-x-10">
        @for (column of columns(); track $index) {
          <div>
            @for (item of column; track item.id) {
              <details class="group border-t border-line" data-testid="faq-item">
                <summary
                  class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold after:font-mono after:text-xl after:leading-none after:text-primary after:transition-transform after:content-['+'_/_''] group-open:after:rotate-45 motion-reduce:after:transition-none [&::-webkit-details-marker]:hidden"
                  data-testid="faq-question"
                >
                  {{ item.question }}
                </summary>
                <p class="max-w-[34rem] pb-4.5 leading-relaxed text-muted" data-testid="faq-answer">
                  {{ item.answer }}
                </p>
              </details>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class FaqList {
  readonly heading = input.required<string>();
  readonly headingId = input.required<string>();
  readonly items = input.required<readonly FaqItem[]>();
  readonly lead = input<string>('');

  // Deux colonnes indépendantes : une réponse ouverte n'étire pas la ligne de la colonne voisine.
  protected readonly columns = computed(() => {
    const half = Math.ceil(this.items().length / 2);
    return [this.items().slice(0, half), this.items().slice(half)];
  });
}
