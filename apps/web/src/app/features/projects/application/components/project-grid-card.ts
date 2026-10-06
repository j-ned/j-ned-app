import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import type { ProjectCardView } from '../projects-view';
import { ProjectCover } from './project-cover';

@Component({
  selector: 'app-project-grid-card',
  imports: [RouterLink, AppIcon, ProjectCover],
  host: { class: 'block' },
  template: `
    @let project = card();
    <article data-testid="project-grid-card" class="group relative">
      <app-project-cover
        data-testid="project-grid-card-cover"
        [image]="project.image"
        [alt]="coverAlt()"
        [kind]="project.kind"
      />
      <div
        class="mt-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
      >
        <h3
          data-testid="project-grid-card-title"
          class="text-xl font-bold tracking-[-0.02em] transition-colors group-hover:text-primary"
        >
          {{ project.title }}
        </h3>
        @if (project.stack) {
          <p data-testid="project-grid-card-stack" class="font-mono text-xs text-muted">
            {{ project.stack }}
          </p>
        }
      </div>
      <p
        data-testid="project-grid-card-pitch"
        class="mt-2 max-w-[56ch] text-[0.9375rem] text-muted"
      >
        {{ project.pitch }}
      </p>
      <a
        data-testid="project-grid-card-link"
        class="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary after:absolute after:inset-0 hover:underline"
        [routerLink]="['/projects', project.slug]"
        >Voir la fiche<span data-testid="project-grid-card-link-context" class="sr-only">{{
          linkContext()
        }}</span>
        <app-icon name="arrow-right" [size]="14" />
      </a>
    </article>
  `,
})
export class ProjectGridCard {
  readonly card = input.required<ProjectCardView>();

  protected readonly coverAlt = computed(() => `Aperçu du projet ${this.card().title}`);
  protected readonly linkContext = computed(() => `\u00a0: ${this.card().title}`);
}
