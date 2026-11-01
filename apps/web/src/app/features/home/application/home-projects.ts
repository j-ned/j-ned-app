import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeaturedProjectCard } from '@features/projects/application/components/featured-project-card';
import {
  toFeaturedProjectView,
  type FeaturedProjectView,
} from '@features/projects/application/featured-project-view';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import type { Project } from '@features/projects/domain/models/project.model';

const PROJECTS_SECTION = {
  title: 'Des projets en production, et pourquoi ils sont construits ainsi',
  description:
    "Chaque fiche détaille les choix techniques et les décisions d'architecture, avec leurs compromis.",
} as const;

@Component({
  selector: 'app-home-projects',
  imports: [FeaturedProjectCard, Button, AppIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block animate-fade-up' },
  template: `
    <section id="projects" aria-labelledby="projects-heading">
      <header class="grid gap-4 mb-12 lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2 id="projects-heading" class="section-title">
          {{ projectsSection.title }}
        </h2>
        <p class="max-w-[52ch] text-muted">
          {{ projectsSection.description }}
        </p>
      </header>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
        @for (project of featuredProjects(); track project.id) {
          <li>
            <app-featured-project-card
              [card]="project"
              (liveLinkClicked)="liveLinkClicked.emit(project)"
            />
          </li>
        }
      </ul>

      <nav class="mt-10" aria-label="Voir tous les projets">
        <a appButton routerLink="/projects" data-testid="home-projects-all">
          Voir tous les projets
          <app-icon name="arrow-right" [size]="20" />
        </a>
      </nav>
    </section>
  `,
})
export class HomeProjects {
  readonly projects = input<readonly Project[]>([]);
  readonly liveLinkClicked = output<FeaturedProjectView>();
  protected readonly featuredProjects = computed(() => this.projects().map(toFeaturedProjectView));
  protected readonly projectsSection = PROJECTS_SECTION;
}
