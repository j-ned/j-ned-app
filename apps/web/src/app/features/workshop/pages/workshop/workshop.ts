import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { injectMarkUnavailable } from '@core/ssr/response-status';
import { LinkCard } from '@shared/ui/link-card';
import { WORKSHOP_SPACE } from '../../domain/workshop-space.static-data';
import { HttpInsertGuideGateway } from '../../infra/gateways/http-insert-guide.gateway';

@Component({
  selector: 'app-workshop',
  imports: [RouterLink, LinkCard],
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
      @if (tools().length > 0) {
        <section data-testid="workshop-tools" aria-labelledby="workshop-tools-title" class="mt-14">
          <h2 id="workshop-tools-title" class="section-title">{{ space.toolsHeading }}</h2>
          <ul role="list" class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (tool of tools(); track tool.id) {
              <li class="grid">
                <a
                  app-link-card
                  data-testid="workshop-tool-card"
                  [routerLink]="tool.path"
                  [overline]="tool.overline"
                  [heading]="tool.title"
                  [summary]="tool.summary"
                ></a>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export class Workshop {
  private readonly _insertGuideGateway = inject(HttpInsertGuideGateway);
  private readonly _markUnavailable = injectMarkUnavailable();

  protected readonly space = WORKSHOP_SPACE;

  private readonly _insertGuideResource = rxResource({
    stream: () =>
      this._insertGuideGateway.getGuide().pipe(tap({ error: () => this._markUnavailable() })),
  });
  private readonly _insertGuideEnabled = computed(
    () => this._insertGuideResource.hasValue() && this._insertGuideResource.value().enabled,
  );
  protected readonly tools = computed(() =>
    this.space.tools.filter(({ id }) => id !== 'insert-guide' || this._insertGuideEnabled()),
  );
}
