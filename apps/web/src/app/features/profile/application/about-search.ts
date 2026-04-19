import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from './tokens';

@Component({
  selector: 'app-about-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      class="bg-linear-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6 shadow-lg"
    >
      <div class="flex items-center gap-2 mb-4">
        <i class="pi pi-compass text-xl text-accent" aria-hidden="true"></i>
        <h2 class="font-bold text-2xl text-foreground">{{ whatISeek()?.title }}</h2>
      </div>
      <p class="text-muted text-sm leading-relaxed">
        {{ whatISeek()?.description }}
      </p>
    </section>
  `,
})
export class AboutSearch {
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  private readonly whatISeekResource = rxResource({
    stream: () => this.profileGateway.getWhatISeek(),
  });
  protected readonly whatISeek = computed(() => this.whatISeekResource.value());
}
