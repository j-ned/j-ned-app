import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProjectCard } from '../projects/components/project-card';
import { ButtonComponent } from '../../layout/components/button/button';
import { PROJECTS_GATEWAY } from '../../core/projects/gateways';

@Component({
  selector: 'app-home-projects',
  imports: [ProjectCard, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="projects" class="py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-end justify-between mb-8">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              {{ projectsSection().title }}
            </h2>
            <p class="text-muted max-w-2xl">
              {{ projectsSection().description }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          @for (project of featuredProjects(); track project.id) {
            <app-project-card [project]="project" />
          }
        </div>

        <div class="mt-8 text-center">
          <app-button variant="primary" size="md" radius="md" (clicked)="goToProjects()">
            Voir tous les projets
            <svg class="w-5 h-5">
              <use href="/icons/sprite.svg#lucide-laptop"></use>
            </svg>
          </app-button>
        </div>
      </div>
    </section>
  `,
})
export class HomeProjects {
  private router = inject(Router);
  private projectsGateway = inject(PROJECTS_GATEWAY);

  // Load featured projects from gateway
  private featuredProjectsObservable = this.projectsGateway.getFeaturedProjects();
  protected readonly featuredProjects = toSignal(this.featuredProjectsObservable, {
    initialValue: [],
  });

  // Section metadata (hardcoded for now)
  protected readonly projectsSection = (): { title: string; description: string } => ({
    title: 'Aperçu des projets',
    description:
      "Une sélection de mes réalisations récentes. Chaque projet met l'accent sur la qualité du code, la performance et l'expérience utilisateur.",
  });

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }
}
