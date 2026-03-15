import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProjectCard } from '@features/projects/application';
import { ButtonComponent } from '@layout';
import { PROJECTS_GATEWAY } from '@features/projects/application';

@Component({
  selector: 'app-home-projects',
  imports: [ProjectCard, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="projects">
      <header class="text-center mb-14">
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
        >
          <svg aria-hidden="true" class="w-4 h-4">
            <use href="/icons/sprite.svg#lucide-laptop"></use>
          </svg>
          Portfolio
        </span>
        <h2
          class="text-3xl md:text-5xl font-extrabold tracking-tight mb-5"
          style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
        >
          {{ projectsSection().title }}
        </h2>
        <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          {{ projectsSection().description }}
        </p>
      </header>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-8" role="list">
        @for (project of featuredProjects(); track project.id) {
          <li><app-project-card [project]="project" /></li>
        }
      </ul>

      <nav class="mt-8 text-center" aria-label="Voir tous les projets">
        <app-button variant="primary" size="md" radius="md" (clicked)="goToProjects()">
          Voir tous les projets
          <svg aria-hidden="true" class="w-5 h-5">
            <use href="/icons/sprite.svg#lucide-laptop"></use>
          </svg>
        </app-button>
      </nav>
    </section>
  `,
})
export class HomeProjects {
  private router = inject(Router);
  private projectsGateway = inject(PROJECTS_GATEWAY);

  private featuredProjectsObservable = this.projectsGateway.getFeaturedProjects();
  protected readonly featuredProjects = toSignal(this.featuredProjectsObservable, {
    initialValue: [],
  });

  protected readonly projectsSection = (): { title: string; description: string } => ({
    title: 'Aperçu des projets',
    description:
      "Une sélection de mes réalisations récentes. Chaque projet met l'accent sur la qualité du code, la performance et l'expérience utilisateur.",
  });

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }
}
