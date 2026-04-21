import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectCard } from '@features/projects/application';
import { UiButton } from '@shared/ui';
import type { Project } from '@features/projects/domain';

@Component({
  selector: 'app-home-projects',
  imports: [ProjectCard, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="projects">
      <header class="text-center mb-6 md:mb-8">
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-3"
        >
          <i class="pi pi-desktop text-sm" aria-hidden="true"></i>
          Portfolio
        </span>
        <h2
          class="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 leading-[1.2] pb-1"
          style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
        >
          {{ projectsSection().title }}
        </h2>
        <p class="text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          {{ projectsSection().description }}
        </p>
      </header>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
        @for (project of featuredProjects(); track project.id) {
          <li><app-project-card [project]="project" /></li>
        }
      </ul>

      <nav class="mt-6 text-center" aria-label="Voir tous les projets">
        <app-ui-button severity="primary" (click)="goToProjects()">
          Voir tous les projets
          <i class="pi pi-desktop" aria-hidden="true"></i>
        </app-ui-button>
      </nav>
    </section>
  `,
})
export class HomeProjects {
  private router = inject(Router);
  readonly projects = input<readonly Project[]>([]);
  protected readonly featuredProjects = this.projects;

  protected readonly projectsSection = (): { title: string; description: string } => ({
    title: 'Aperçu des projets',
    description:
      "Une sélection de mes réalisations récentes. Chaque projet met l'accent sur la qualité du code, la performance et l'expérience utilisateur.",
  });

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }
}
