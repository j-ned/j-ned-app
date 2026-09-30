import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-about-motivation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    <section class="animate-fade-up bg-surface border border-primary/20 rounded-2xl p-6">
      <div class="flex items-center gap-2 mb-4">
        <app-icon name="compass" [size]="20" class="text-primary" />
        <h2 class="font-bold text-2xl text-foreground">{{ motivation()?.title }}</h2>
      </div>
      <p class="text-muted text-sm leading-relaxed">
        {{ motivation()?.description }}
      </p>
    </section>
  `,
})
export class AboutMotivation {
  private readonly _gateway = inject(ProfileGateway);

  private readonly motivationResource = rxResource({
    stream: () => this._gateway.getMotivation(),
  });
  protected readonly motivation = computed(() => this.motivationResource.value());
}
