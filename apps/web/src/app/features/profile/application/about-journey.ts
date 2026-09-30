import { Component, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { SplitSection } from '@shared/ui/split-section';

@Component({
  selector: 'app-about-journey',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    @let bio = biography();
    @if (bio) {
      <app-split-section headingId="journey-heading" [heading]="bio.title" [summary]="bio.summary">
        <div class="flex flex-col gap-5.5">
          @for (paragraph of bio.paragraphs; track paragraph; let first = $first) {
            <p
              class="max-w-[64ch] text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-[1.7]"
              [class]="first ? 'font-medium text-foreground' : 'text-foreground/80'"
              data-testid="journey-paragraph"
            >
              {{ paragraph }}
            </p>
          }
        </div>
      </app-split-section>
    }
  `,
})
export class AboutJourney {
  private readonly _gateway = inject(ProfileGateway);
  private readonly biographyResource = rxResource({
    stream: () => this._gateway.getBiography(),
  });
  protected readonly biography = computed(() => this.biographyResource.value());
}
