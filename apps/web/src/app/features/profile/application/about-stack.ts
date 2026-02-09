import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '../domain';

@Component({
  selector: 'app-about-stack',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg h-full',
  },
  template: `
    <header class="flex items-center gap-2 mb-6">
      <svg class="w-6 h-6 text-primary">
        <use href="/icons/sprite.svg#lucide-code-xml"></use>
      </svg>
      <h2 class="font-bold text-xl text-foreground">Stack Technique</h2>
    </header>
    <ul class="grid grid-cols-3 gap-3" role="list">
      @for (tech of technologies(); track tech.name) {
        <li
          class="bg-background/50 border border-foreground/10 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all group cursor-pointer"
        >
          <img
            [ngSrc]="'/icons/' + tech.icon + '.svg'"
            [alt]="tech.name"
            width="32"
            height="32"
            class="w-8 h-8 group-hover:scale-110 transition-transform"
          />
          <p class="text-[10px] font-medium text-foreground text-center leading-tight">
            {{ tech.name }}
          </p>
        </li>
      }
    </ul>
  `,
})
export class AboutStack {
  private profileGateway = inject(PROFILE_GATEWAY);
  private technologiesObservable = this.profileGateway.getTechnologies();
  protected readonly technologies = toSignal(this.technologiesObservable, { initialValue: [] });
}
