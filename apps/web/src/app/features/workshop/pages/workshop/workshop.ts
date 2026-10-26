import { Component } from '@angular/core';
import { WORKSHOP_SPACE } from '../../domain/workshop-space.static-data';

@Component({
  selector: 'app-workshop',
  host: { class: 'block min-h-svh pt-20' },
  template: `
    <div class="page-container pt-18 pb-14 md:pt-26 md:pb-18">
      <h1
        data-testid="workshop-title"
        class="text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-none tracking-[-0.04em]"
      >
        {{ space.heading }}
      </h1>
      <div
        class="animate-fade-up [animation-delay:120ms] mt-5.5 grid max-w-[56ch] gap-4 text-[clamp(1.0625rem,1.4vw,1.25rem)] text-muted"
      >
        @for (paragraph of space.intro; track paragraph) {
          <p data-testid="workshop-intro">{{ paragraph }}</p>
        }
      </div>
    </div>
  `,
})
export class Workshop {
  protected readonly space = WORKSHOP_SPACE;
}
