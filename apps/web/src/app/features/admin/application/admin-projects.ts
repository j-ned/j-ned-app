import { Component, DestroyRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import type { Project } from '@features/projects/domain';
import { HOME_GATEWAY } from '@features/home/application';
import { AdminProjectInlineForm } from './components/admin-project-inline-form';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-projects',
  imports: [AdminProjectInlineForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-foreground">Projets</h1>
        <div class="flex items-center gap-4">
          <select
            [value]="selectedCategory()"
            (change)="selectedCategory.set($any($event.target).value)"
            class="px-4 py-2 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground text-sm focus:border-primary focus:outline-none transition-colors"
          >
            @for (cat of categories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
          <button
            (click)="toggleNewForm()"
            class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {{ showNewForm() ? 'Annuler' : 'Nouveau projet' }}
          </button>
        </div>
      </div>

      <!-- New project form -->
      @if (showNewForm()) {
        <div class="mb-6">
          <app-admin-project-inline-form
            (saved)="onCreate($event)"
            (cancelled)="showNewForm.set(false)"
          />
        </div>
      }

      <!-- Projects list -->
      <div class="space-y-3">
        @for (project of filteredProjects(); track project.id) {
          <div
            class="bg-background border border-foreground/10 rounded-xl shadow-sm overflow-hidden"
          >
            <!-- Card row -->
            <div class="flex items-center gap-4 px-5 py-4">
              <!-- Thumbnail -->
              <div class="shrink-0">
                @if (project.image) {
                  <img
                    [src]="project.image"
                    [alt]="project.title"
                    class="w-12 h-12 rounded-lg object-cover"
                  />
                } @else {
                  <div
                    class="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                }
              </div>

              <!-- Title + tags -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">{{ project.title }}</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  @for (tag of project.tags.slice(0, 4); track tag) {
                    <span
                      class="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary font-medium"
                    >
                      {{ tag }}
                    </span>
                  }
                  @if (project.tags.length > 4) {
                    <span class="px-1.5 py-0.5 text-[10px] rounded bg-foreground/10 text-muted">
                      +{{ project.tags.length - 4 }}
                    </span>
                  }
                </div>
              </div>

              <!-- Category + featured -->
              <div class="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <span class="text-xs text-muted">{{ project.category }}</span>
                @if (project.featured) {
                  <span class="px-2 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-400">
                    Featured
                  </span>
                }
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <button
                  (click)="toggleEdit(project.id)"
                  class="px-3 py-1.5 text-xs rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                >
                  {{ editingId() === project.id ? 'Fermer' : 'Modifier' }}
                </button>
                <button
                  (click)="deleteProject(project)"
                  class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>

            <!-- Inline edit form -->
            @if (editingId() === project.id) {
              <div class="px-5 pb-5">
                <app-admin-project-inline-form
                  [project]="project"
                  (saved)="onUpdate(project.id, $event)"
                  (cancelled)="editingId.set(null)"
                />
              </div>
            }
          </div>
        } @empty {
          <div
            class="text-center py-12 text-muted text-sm bg-background border border-foreground/10 rounded-xl"
          >
            Aucun projet
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminProjects {
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedCategory = signal('Tous');
  readonly editingId = signal<string | null>(null);
  readonly showNewForm = signal(false);

  private readonly projectsResource = rxResource({
    stream: () => this.projectsGateway.filterProjects({}),
  });

  private readonly categoriesResource = rxResource({
    stream: () => this.projectsGateway.getCategories(),
  });

  readonly projects = computed(() => this.projectsResource.value() ?? []);
  readonly categories = computed(() => this.categoriesResource.value() ?? ['Tous']);

  readonly filteredProjects = computed(() => {
    const cat = this.selectedCategory();
    const all = this.projects();
    if (!cat || cat === 'Tous') return all;
    return all.filter((p) => p.category === cat);
  });

  toggleNewForm(): void {
    this.showNewForm.update((v) => !v);
    if (this.showNewForm()) {
      this.editingId.set(null);
    }
  }

  toggleEdit(id: string): void {
    this.editingId.update((current) => (current === id ? null : id));
    this.showNewForm.set(false);
  }

  onCreate(event: { data: Omit<Project, 'id'>; file: File | null }): void {
    const slug = this.slugify(event.data.title);

    if (event.file) {
      this.projectsGateway
        .uploadImage(event.file, slug)
        .pipe(
          switchMap((key) => this.projectsGateway.createProject({ ...event.data, image: key })),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.showNewForm.set(false);
            this.reload();
            this.toast.success('Projet créé');
          },
          error: () => this.toast.error('Erreur lors de la création du projet'),
        });
    } else {
      this.projectsGateway
        .createProject(event.data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.showNewForm.set(false);
            this.reload();
            this.toast.success('Projet créé');
          },
          error: () => this.toast.error('Erreur lors de la création du projet'),
        });
    }
  }

  onUpdate(id: string, event: { data: Omit<Project, 'id'>; file: File | null }): void {
    const slug = this.slugify(event.data.title);

    if (event.file) {
      this.projectsGateway
        .uploadImage(event.file, slug)
        .pipe(
          switchMap((key) => this.projectsGateway.updateProject(id, { ...event.data, image: key })),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.editingId.set(null);
            this.reload();
            this.toast.success('Projet mis à jour');
          },
          error: () => this.toast.error('Erreur lors de la mise à jour du projet'),
        });
    } else {
      this.projectsGateway
        .updateProject(id, event.data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.editingId.set(null);
            this.reload();
            this.toast.success('Projet mis à jour');
          },
          error: () => this.toast.error('Erreur lors de la mise à jour du projet'),
        });
    }
  }

  deleteProject(project: Project): void {
    this.projectsGateway
      .deleteProject(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reload();
          this.toast.success('Projet supprimé');
        },
        error: () => this.toast.error('Erreur lors de la suppression du projet'),
      });
  }

  private reload(): void {
    this.projectsResource.reload();
    this.categoriesResource.reload();
    this.homeGateway.invalidateBundle();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
