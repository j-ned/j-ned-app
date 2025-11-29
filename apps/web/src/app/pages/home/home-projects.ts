import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { PROJECTS_SECTION } from './data/home.data';
import { FEATURED_PROJECTS } from '../projects/data/projects.data';
import { ProjectCard } from '../projects/components/project-card';

@Component({
  selector: 'app-home-projects',
  imports: [ProjectCard],
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
          <a
            href="/projects"
            class="hidden md:inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            Tous mes projets →
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          @for (project of featuredProjects(); track project.id) {
            <app-project-card [project]="project" />
          }
        </div>

        <div class="mt-8 text-center md:hidden">
          <a
            href="/projects"
            class="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            Tous mes projets →
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HomeProjects {
  protected readonly projectsSection = signal(PROJECTS_SECTION);
  protected readonly featuredProjects = signal(FEATURED_PROJECTS);
}
