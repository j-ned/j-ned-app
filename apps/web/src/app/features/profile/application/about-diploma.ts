import { Component, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { SplitSection } from '@shared/ui/split-section';

const DIPLOMA_SUMMARY = 'Deux titres professionnels de niveau 5 (Bac+2).';

@Component({
  selector: 'app-about-diploma',
  imports: [SplitSection],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="diploma-heading" heading="Formations" [summary]="summary">
      <ul class="border-t border-foreground/8" role="list">
        @for (diploma of diplomas(); track diploma.id) {
          <li
            class="grid gap-x-10 gap-y-2 border-b border-foreground/8 py-7 lg:grid-cols-[14rem_minmax(0,1fr)]"
            data-testid="about-diploma"
          >
            <div>
              <p class="font-mono text-[0.8125rem] font-medium text-primary">
                {{ diploma.provider }}
              </p>
              <p class="mt-1 font-mono text-xs text-muted">{{ diploma.level }}</p>
            </div>
            <div>
              <h3 class="text-[1.1875rem] font-semibold tracking-tight">{{ diploma.title }}</h3>
              <p class="mt-2 max-w-[64ch] text-[0.96875rem] leading-relaxed text-muted">
                {{ diploma.shortDescription }}
              </p>
              <ul
                class="mt-3 flex flex-wrap gap-x-2 font-mono text-[0.8125rem] leading-[1.7] text-foreground/80"
                [attr.aria-label]="'Compétences acquises : ' + diploma.title"
                role="list"
              >
                @for (skill of diploma.skills; track skill) {
                  <li
                    class="after:ml-2 after:text-muted after:content-['·'] last:after:content-none"
                  >
                    {{ skill }}
                  </li>
                }
              </ul>
            </div>
          </li>
        }
      </ul>
    </app-split-section>
  `,
})
export class AboutDiploma {
  private readonly _gateway = inject(ProfileGateway);

  protected readonly summary = DIPLOMA_SUMMARY;

  private readonly diplomasResource = rxResource({
    stream: () => this._gateway.getDiplomas(),
  });
  protected readonly diplomas = computed(() => this.diplomasResource.value() ?? []);
}
