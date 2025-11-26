import { Component, signal } from '@angular/core';
import { TECHNOLOGIES } from './data/about.data';

@Component({
  selector: 'app-about-stack',
  template: `
    <div
      class="bg-gradient-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg h-full"
    >
      <div class="flex items-center gap-2 mb-6">
        <svg class="w-5 h-5 text-primary">
          <use href="/icons/sprite.svg#lucide-code"></use>
        </svg>
        <h3 class="font-bold text-lg text-foreground">Stack Technique</h3>
      </div>
      <div class="grid grid-cols-3 gap-3">
        @for (tech of technologies(); track tech.name) {
          <div
            class="bg-background/50 border border-foreground/10 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all group cursor-pointer"
          >
            <svg
              class="w-8 h-8 text-accent group-hover:scale-110 transition-transform"
            >
              <use [attr.href]="'/icons/sprite.svg#' + tech.icon"></use>
            </svg>
            <span
              class="text-[10px] font-medium text-foreground text-center leading-tight"
            >
                        {{ tech.name }}
                      </span>
          </div>
        }
      </div>
    </div>
  `
})
export class AboutStack {
  protected readonly technologies = signal(TECHNOLOGIES);
}
