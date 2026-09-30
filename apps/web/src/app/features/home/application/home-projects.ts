import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectCard } from '@features/projects/application/components/project-card';
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
  imports: [ProjectCard, Button, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block animate-fade-up' },
  template: `
    <section id="projects" aria-labelledby="projects-heading">
      <header class="grid gap-4 mb-12 lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2
          id="projects-heading"
          class="text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold leading-[1.12] tracking-tight text-balance"
        >
          {{ projectsSection.title }}
        </h2>
        <p class="max-w-[52ch] text-muted">
          {{ projectsSection.description }}
        </p>
      </header>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
        @for (project of featuredProjects(); track project.id) {
          <li><app-project-card [project]="project" [showKeyDecision]="true" /></li>
        }
      </ul>

      <nav class="mt-10" aria-label="Voir tous les projets">
        <app-button severity="primary" (click)="goToProjects()">
          Voir tous les projets
          <app-icon name="arrow-right" [size]="20" />
        </app-button>
      </nav>
    </section>
  `,
})
export class HomeProjects {
  private readonly _router = inject(Router);
  readonly projects = input<readonly Project[]>([]);
  protected readonly featuredProjects = this.projects;
  protected readonly projectsSection = PROJECTS_SECTION;

  protected goToProjects(): void {
    void this._router.navigate(['/projects']);
  }
}
