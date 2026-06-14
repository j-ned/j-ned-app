import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-about-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    <section
      class="animate-fade-up bg-linear-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6"
    >
      <div class="flex items-center gap-2 mb-4">
        <app-icon name="compass" [size]="20" class="text-accent" />
        <h2 class="font-bold text-2xl text-foreground">{{ whatISeek()?.title }}</h2>
      </div>
      <p class="text-muted text-sm leading-relaxed">
        {{ whatISeek()?.description }}
      </p>
    </section>
  `,
})
export class AboutSearch {
  private readonly _gateway = inject(ProfileGateway);

  private readonly whatISeekResource = rxResource({
    stream: () => this._gateway.getWhatISeek(),
  });
  protected readonly whatISeek = computed(() => this.whatISeekResource.value());
}
