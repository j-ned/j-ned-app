import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { WHAT_I_DO } from './data/about.data';

@Component({
  selector: 'app-about-what-i-do',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div>
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-primary">
          <use href="/icons/sprite.svg#lucide-code-xml"></use>
        </svg>
        <h2 class="text-2xl font-bold text-foreground">Ce que je fais</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of whatIDo(); track item.title) {
          <div
            class="bg-background/50 border border-foreground/10 rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <h3
              class="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors"
            >
              {{ item.title }}
            </h3>
            <p class="text-muted text-sm leading-relaxed">
              {{ item.description }}
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AboutWhatIDo {
  protected readonly whatIDo = signal(WHAT_I_DO);
}
