import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Project } from '@features/projects/domain/models/project.model';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-project-detail-nav',
  imports: [RouterLink, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav
      class="page-container mt-16 md:mt-20 pt-8 border-t border-foreground/10 flex items-center justify-between gap-4"
      aria-label="Navigation entre projets"
    >
      @if (previousProject(); as prev) {
        <a
          [routerLink]="['/projects', prev.slug]"
          class="group flex-1 min-w-0 inline-flex flex-col items-start gap-0.5 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <span class="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
            <app-icon
              name="chevron-left"
              [size]="14"
              class="transition-transform group-hover:-translate-x-0.5"
            />
            Précédent
          </span>
          <span class="truncate max-w-full font-medium text-foreground group-hover:text-primary transition-colors">
            {{ prev.title }}
          </span>
        </a>
      } @else {
        <span class="flex-1"></span>
      }

      <a
        routerLink="/projects"
        class="shrink-0 text-sm font-medium text-muted hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-lg"
      >
        Tous les projets
      </a>

      @if (nextProject(); as next) {
        <a
          [routerLink]="['/projects', next.slug]"
          class="group flex-1 min-w-0 inline-flex flex-col items-end gap-0.5 text-right rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <span class="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
            Suivant
            <app-icon
              name="chevron-right"
              [size]="14"
              class="transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span class="truncate max-w-full font-medium text-foreground group-hover:text-primary transition-colors">
            {{ next.title }}
          </span>
        </a>
      } @else {
        <span class="flex-1"></span>
      }
    </nav>
  `,
})
export class ProjectDetailNav {
  readonly previousProject = input<Project | undefined>(undefined);
  readonly nextProject = input<Project | undefined>(undefined);
}
