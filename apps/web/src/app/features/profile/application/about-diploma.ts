import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '../domain/gateways';

@Component({
  selector: 'app-about-diploma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
    >
      <div class="flex items-center gap-2 mb-6">
        <svg class="w-6 h-6 text-primary">
          <use href="/icons/sprite.svg#lucide-graduation-cap"></use>
        </svg>
        <h2 class="font-bold text-2xl text-foreground">Formations</h2>
      </div>

      @for (diploma of diplomas(); track diploma.id; let isFirst = $first) {
        @if (!isFirst) {
          <div class="border-t border-foreground/10 my-8"></div>
        }
        <div>
          <h3 class="text-lg font-bold text-foreground mb-2">
            {{ diploma.title }}
          </h3>
          <p class="text-accent font-medium mb-2 text-md">
            {{ diploma.provider }}
          </p>
          <p class="text-muted text-xs mb-4 leading-relaxed">
            {{ diploma.shortDescription }}
          </p>

          <div class="border-t border-foreground/10 pt-4">
            <h4 class="text-xs font-semibold text-muted mb-3">Compétences acquises</h4>
            <div class="flex flex-wrap gap-2">
              @for (skill of diploma.skills; track skill) {
                <span
                  class="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-foreground border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  {{ skill }}
                </span>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AboutDiploma {
  private profileGateway = inject(PROFILE_GATEWAY);
  private diplomasObservable = this.profileGateway.getDiplomas();
  protected readonly diplomas = toSignal(this.diplomasObservable, { initialValue: [] });
}
