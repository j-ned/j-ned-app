import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { liveLinkContext, liveLinkLabel } from '../project-kind-copy';
import type { CaseStudyView } from '../projects-view';
import { ProjectCover } from './project-cover';

@Component({
  selector: 'app-project-case-study',
  imports: [RouterLink, AppIcon, ProjectCover],
  host: { class: 'block' },
  template: `
    @let study = caseStudy();
    <article
      data-testid="project-case-study"
      class="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12"
    >
      <app-project-cover
        data-testid="project-case-study-cover"
        class="lg:col-span-7"
        [class.lg:order-last]="reversed()"
        [image]="study.image"
        [alt]="coverAlt()"
        kind="production"
        [priority]="priority()"
      />
      <div class="lg:col-span-5">
        <p data-testid="project-case-study-overline" class="font-mono text-xs text-muted">
          {{ study.overline }}
        </p>
        <h3
          data-testid="project-case-study-title"
          class="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-tight tracking-[-0.03em]"
        >
          {{ study.title }}
        </h3>
        <p data-testid="project-case-study-pitch" class="mt-4 max-w-[46ch] text-muted">
          {{ study.pitch }}
        </p>
        @if (study.facts.length > 0) {
          <dl
            data-testid="project-case-study-facts"
            class="mt-6 grid grid-cols-[6rem_minmax(0,1fr)] border-t border-line text-sm"
          >
            @for (fact of study.facts; track fact.label) {
              <div class="col-span-full grid grid-cols-subgrid gap-x-4 border-b border-line py-2.5">
                <dt
                  data-testid="project-case-study-fact-label"
                  class="font-mono text-xs leading-5 text-muted"
                >
                  {{ fact.label }}
                </dt>
                <dd data-testid="project-case-study-fact-value">{{ fact.value }}</dd>
              </div>
            }
          </dl>
        }
        <div class="mt-7 flex flex-wrap gap-3">
          <a
            data-testid="project-case-study-link"
            class="link-btn-primary"
            [routerLink]="['/projects', study.slug]"
            >Voir la fiche<span data-testid="project-case-study-link-context" class="sr-only">{{
              linkContext()
            }}</span>
            <app-icon name="arrow-right" [size]="16" />
          </a>
          @if (study.liveUrl; as liveUrl) {
            <a
              data-testid="project-case-study-live-link"
              class="link-btn-outline"
              [href]="liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              (click)="liveLinkClicked.emit()"
              >{{ liveLabel }}<span class="sr-only">{{ liveContext() }}</span>
              <app-icon name="external-link" [size]="16" />
            </a>
          }
        </div>
      </div>
    </article>
  `,
})
export class ProjectCaseStudy {
  readonly caseStudy = input.required<CaseStudyView>();
  readonly priority = input(false);
  readonly reversed = input(false);
  readonly liveLinkClicked = output<void>();

  protected readonly liveLabel = liveLinkLabel('production');
  protected readonly coverAlt = computed(() => `Aperçu du projet ${this.caseStudy().title}`);
  protected readonly linkContext = computed(() => `\u00a0: ${this.caseStudy().title}`);
  protected readonly liveContext = computed(() => liveLinkContext(this.caseStudy().title));
}
