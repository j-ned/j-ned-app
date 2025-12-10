import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '../../core/profile/gateways';

@Component({
  selector: 'app-about-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg h-full"
    >
      <div class="flex items-center gap-2 mb-6">
        <svg class="w-6 h-6 text-primary">
          <use href="/icons/sprite.svg#lucide-code-xml"></use>
        </svg>
        <h3 class="font-bold text-xl text-foreground">Stack Technique</h3>
      </div>
      <div class="grid grid-cols-3 gap-3">
        @for (tech of technologies(); track tech.name) {
          <div
            class="bg-background/50 border border-foreground/10 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all group cursor-pointer"
          >
            <img
              [src]="'/icons/' + tech.icon + '.svg'"
              [alt]="tech.name"
              class="w-8 h-8 group-hover:scale-110 transition-transform"
            />
            <span class="text-[10px] font-medium text-foreground text-center leading-tight">
              {{ tech.name }}
            </span>
          </div>
        }
      </div>
    </div>
  `,
})
export class AboutStack {
  private profileGateway = inject(PROFILE_GATEWAY);
  private technologiesObservable = this.profileGateway.getTechnologies();
  protected readonly technologies = toSignal(this.technologiesObservable, { initialValue: [] });
}
