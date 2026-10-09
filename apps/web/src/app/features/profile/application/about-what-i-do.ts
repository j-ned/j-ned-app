import { Component, input } from '@angular/core';
import type { Technology } from '@features/profile/domain/models/technology.model';
import type { WhatIDo } from '@features/profile/domain/models/what-i-do.model';
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
      <app-about-stack class="mt-4" [technologies]="technologies()" />
    </app-split-section>
  `,
})
export class AboutWhatIDo {
  readonly whatIDo = input.required<readonly WhatIDo[]>();
  readonly technologies = input.required<readonly Technology[]>();

  protected readonly summary = WORK_SUMMARY;
}
