import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { PROJECTS_SECTION } from './data/home.data';
import { FEATURED_PROJECTS } from '../projects/data/projects.data';
import { ProjectCard } from '../projects/components/project-card';
import { ButtonComponent } from '../../shared/components/button/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-projects',
  imports: [ProjectCard, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section id="projects" class="py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-end justify-between mb-12">
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
  protected readonly projectsSection = signal(PROJECTS_SECTION);
  protected readonly featuredProjects = signal(FEATURED_PROJECTS);

  private readonly router = inject(Router);

  goToProjects() {
    this.router.navigate(['/projects']);
  }
}
