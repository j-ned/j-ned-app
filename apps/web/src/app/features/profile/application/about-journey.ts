import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from './tokens';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-about-journey',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    @if (biography()) {
      <section>
        <header class="flex items-center gap-2 mb-4">
          <app-icon name="user" [size]="24" class="text-primary" />
          <h2 class="text-2xl font-bold text-foreground">{{ biography()!.title }}</h2>
        </header>
        <div class="space-y-3">
          @for (paragraph of biography()!.paragraphs; track paragraph) {
            <p class="text-muted text-sm leading-relaxed">{{ paragraph }}</p>
          }
        </div>
      </section>
    }
  `,
})
export class AboutJourney {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly biographyResource = rxResource({
    stream: () => this.profileGateway.getBiography(),
  });
  protected readonly biography = computed(() => this.biographyResource.value());
}
