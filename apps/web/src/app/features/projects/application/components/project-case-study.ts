import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import {
  liveLinkContext,
  liveLinkLabel,
  projectCoverAlt,
  sheetLinkContext,
} from '../project-kind-copy';
import type { CaseStudyView } from '../projects-view';
import { ProjectCover } from './project-cover';
import { ProjectFactList } from './project-fact-list';

@Component({
  selector: 'app-project-case-study',
  imports: [RouterLink, AppIcon, ProjectCover, ProjectFactList],
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
          <app-project-fact-list class="mt-6" [facts]="study.facts" />
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
  protected readonly coverAlt = computed(() => projectCoverAlt(this.caseStudy().title));
  protected readonly linkContext = computed(() => sheetLinkContext(this.caseStudy().title));
  protected readonly liveContext = computed(() => liveLinkContext(this.caseStudy().title));
}
