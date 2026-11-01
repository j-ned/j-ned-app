import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import type { FeaturedProjectView } from '../featured-project-view';
import { liveLinkContext, projectCoverAlt, sheetLinkContext } from '../project-kind-copy';
import { ProjectCover } from './project-cover';
import { FactList } from '@shared/ui/fact-list';

@Component({
  selector: 'app-featured-project-card',
  imports: [RouterLink, AppIcon, ProjectCover, FactList],
  host: { class: 'block h-full' },
  template: `
    @let project = card();
    <article data-testid="featured-project-card" class="group relative flex h-full flex-col">
      <app-project-cover
        data-testid="featured-project-card-cover"
        [image]="project.image"
        [alt]="coverAlt()"
        [kind]="project.kind"
      />
      <p data-testid="featured-project-card-category" class="mt-5 font-mono text-xs text-muted">
        {{ project.category }}
      </p>
      <h3
        data-testid="featured-project-card-title"
        class="mt-2 text-2xl font-bold tracking-[-0.02em] transition-colors group-hover:text-primary"
      >
        {{ project.title }}
      </h3>
      <p
        data-testid="featured-project-card-pitch"
        class="mt-2 max-w-[56ch] text-[0.9375rem] text-muted"
      >
        {{ project.pitch }}
      </p>
      @if (project.facts.length > 0) {
        <app-fact-list class="mt-5" [facts]="project.facts" />
      }
      <div
        data-testid="featured-project-card-actions"
        class="mt-auto flex flex-wrap items-center gap-x-6 pt-4"
      >
        <a
          data-testid="featured-project-card-link"
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary after:absolute after:inset-0 hover:underline"
          [routerLink]="['/projects', project.slug]"
          >Voir la fiche<span data-testid="featured-project-card-link-context" class="sr-only">{{
            linkContext()
          }}</span>
          <app-icon name="arrow-right" [size]="14" />
        </a>
        @if (project.liveLink; as liveLink) {
          <a
            data-testid="featured-project-card-live-link"
            class="relative z-10 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
            [href]="liveLink.url"
            target="_blank"
            rel="noopener noreferrer"
            (click)="liveLinkClicked.emit()"
            >{{ liveLink.label }}<span class="sr-only">{{ liveContext() }}</span>
            <app-icon name="external-link" [size]="14" />
          </a>
        }
      </div>
    </article>
  `,
})
export class FeaturedProjectCard {
  readonly card = input.required<FeaturedProjectView>();
  readonly liveLinkClicked = output<void>();

  protected readonly coverAlt = computed(() => projectCoverAlt(this.card().title));
  protected readonly linkContext = computed(() => sheetLinkContext(this.card().title));
  protected readonly liveContext = computed(() => liveLinkContext(this.card().title));
}
