import { Component, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { SplitSection } from '@shared/ui/split-section';
import { AboutStack } from './about-stack';

const WORK_SUMMARY = 'Du composant au serveur qui le sert.';

@Component({
  selector: 'app-about-what-i-do',
  imports: [SplitSection, AboutStack],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <app-split-section headingId="work-heading" heading="Ce que je fais" [summary]="summary">
      <div class="grid gap-4 md:grid-cols-2">
        @for (item of whatIDo(); track item.id) {
          <article class="rounded-xl border border-foreground/8 bg-surface p-7">
            <h3 class="text-xl font-semibold tracking-tight">{{ item.title }}</h3>
            <p class="mt-2.5 text-[0.96875rem] leading-relaxed text-muted">
              {{ item.description }}
            </p>
          </article>
        }
      </div>
      <app-about-stack class="mt-4" />
    </app-split-section>
  `,
})
export class AboutWhatIDo {
  private readonly _gateway = inject(ProfileGateway);

  protected readonly summary = WORK_SUMMARY;

  private readonly whatIDoResource = rxResource({
    stream: () => this._gateway.getWhatIDo(),
  });
  protected readonly whatIDo = computed(() => this.whatIDoResource.value() ?? []);
}
