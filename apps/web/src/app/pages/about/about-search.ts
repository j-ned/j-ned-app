import { Component } from '@angular/core';
import { WHAT_I_SEEK } from './data/about.data';

@Component({
  selector: 'app-about-search',
  host: { class: 'block' },
  template: `
    <section
      class="bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6 shadow-lg"
    >
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-accent">
          <use href="/icons/sprite.svg#lucide-compass"></use>
        </svg>
        <h3 class="font-bold text-2xl text-foreground">{{ whatISeek.title }}</h3>
      </div>
      <p class="text-muted text-sm leading-relaxed">
        {{ whatISeek.description }}
      </p>
    </section>
  `
})
export class AboutSearch {
  protected readonly whatISeek = WHAT_I_SEEK;
}
