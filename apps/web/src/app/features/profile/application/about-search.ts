import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '../domain/gateways';

@Component({
  selector: 'app-about-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      class="bg-linear-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6 shadow-lg"
    >
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-accent">
          <use href="/icons/sprite.svg#lucide-compass"></use>
        </svg>
        <h2 class="font-bold text-2xl text-foreground">{{ whatISeek()?.title }}</h2>
      </div>
      <p class="text-muted text-sm leading-relaxed">
        {{ whatISeek()?.description }}
      </p>
    </section>
  `,
})
export class AboutSearch {
  private profileGateway = inject(PROFILE_GATEWAY);
  private whatISeekObservable = this.profileGateway.getWhatISeek();
  protected readonly whatISeek = toSignal(this.whatISeekObservable);
}
