import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { PROFILE_GATEWAY } from '../../core/profile/gateways';

@Component({
  selector: 'app-about-journey',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (biography()) {
      <div>
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-6 h-6 text-primary">
            <use href="/icons/sprite.svg#lucide-user"></use>
          </svg>
          <h2 class="text-2xl font-bold text-foreground">{{ biography()!.title }}</h2>
        </div>
        <div class="space-y-3">
          @for (paragraph of biography()!.paragraphs; track paragraph) {
            <p class="text-muted text-sm leading-relaxed">{{ paragraph }}</p>
          }
        </div>
      </div>
    }
  `,
})
export class AboutJourney {
  private profileGateway = inject(PROFILE_GATEWAY);
  private biographyResource = this.profileGateway.getBiography();
  protected readonly biography = computed(() => this.biographyResource.value());
}
