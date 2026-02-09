import {
  Component,
  inject,
  input,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PROJECTS_GATEWAY } from '../../projects/domain';
import type { Project } from '../../projects/domain';

const SLUG_TO_CATEGORY: Record<string, string> = {
  web: 'Application Web',
  mobile: 'Application Mobile',
  api: 'API / Backend',
  script: 'Script',
  package: 'Package / Librairie',
  extension: 'Extension',
  design: 'Design / Maquette',
};

@Component({
  selector: 'app-admin-projects',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-foreground">{{ pageTitle() }}</h1>
        <a
          routerLink="/admin/projects/new"
          class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Nouveau projet
        </a>
      </div>

      <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-foreground/10">
                <th class="text-left px-6 py-4 text-sm font-medium text-muted">Image</th>
                <th class="text-left px-6 py-4 text-sm font-medium text-muted">Titre</th>
                <th class="text-left px-6 py-4 text-sm font-medium text-muted">Catégorie</th>
                <th class="text-left px-6 py-4 text-sm font-medium text-muted">Featured</th>
                <th class="text-right px-6 py-4 text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (project of projects(); track project.id) {
                <tr class="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                  <td class="px-6 py-4">
                    <img
                      [ngSrc]="project.image"
                      [alt]="project.title"
                      width="48"
                      height="48"
                      class="w-12 h-12 rounded-lg object-cover"
                    />
                  </td>
                  <td class="px-6 py-4 text-sm text-foreground font-medium">
                    {{ project.title }}
                  </td>
                  <td class="px-6 py-4 text-sm text-muted">{{ project.category }}</td>
                  <td class="px-6 py-4">
                    @if (project.featured) {
                      <span class="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-400">
                        Oui
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 text-xs rounded bg-foreground/10 text-muted">
                        Non
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <a
                        [routerLink]="['/admin/projects', project.id, 'edit']"
                        class="px-3 py-1.5 text-xs rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                      >
                        Modifier
                      </a>
                      <button
                        (click)="deleteProject(project)"
                        class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-8 text-center text-muted text-sm">Aucun projet</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminProjects implements OnInit {
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);

  readonly category = input<string>();

  readonly projects = signal<readonly Project[]>([]);

  readonly pageTitle = computed(() => {
    const slug = this.category();
    if (!slug || slug === 'all') return 'Tous les projets';
    return SLUG_TO_CATEGORY[slug] ?? 'Projets';
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  deleteProject(project: Project): void {
    this.projectsGateway.deleteProject(project.id).subscribe(() => this.loadProjects());
  }

  private loadProjects(): void {
    const slug = this.category();
    const categoryName = slug && slug !== 'all' ? SLUG_TO_CATEGORY[slug] : undefined;
    const filter = categoryName ? { category: categoryName } : {};
    this.projectsGateway
      .filterProjects(filter)
      .subscribe((projects) => this.projects.set(projects));
  }
}
