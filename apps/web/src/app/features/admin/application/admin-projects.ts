import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import type { Project } from '@features/projects/domain';
import { HOME_GATEWAY } from '@features/home/application';
import { AdminProjectInlineForm } from './components/admin-project-inline-form';
import { ToastService } from '@shared/ui';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-admin-projects',
  imports: [AdminProjectInlineForm, FormsModule, Button, Select, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-foreground">Projets</h1>
        <div class="flex items-center gap-4">
          <p-select
            [options]="categories()"
            [ngModel]="selectedCategory()"
            (ngModelChange)="selectedCategory.set($event)"
            placeholder="Catégorie"
          />
          <p-button
            [label]="showNewForm() ? 'Annuler' : 'Nouveau projet'"
            [icon]="showNewForm() ? 'pi pi-times' : 'pi pi-plus'"
            [severity]="showNewForm() ? 'secondary' : 'primary'"
            [outlined]="showNewForm()"
            (onClick)="toggleNewForm()"
          />
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
          <div class="bg-surface border border-foreground/10 rounded-xl shadow-sm overflow-hidden">
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
                    <p-tag [value]="tag" severity="info" />
                  }
                  @if (project.tags.length > 4) {
                    <p-tag [value]="'+' + (project.tags.length - 4)" severity="secondary" />
                  }
                </div>
              </div>

              <!-- Category + featured -->
              <div class="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <span class="text-xs text-muted">{{ project.category }}</span>
                @if (project.featured) {
                  <p-tag value="Featured" severity="warn" />
                }
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <p-button
                  [icon]="editingId() === project.id ? 'pi pi-times' : 'pi pi-pencil'"
                  severity="secondary"
                  size="small"
                  [text]="true"
                  (onClick)="toggleEdit(project.id)"
                  [ariaLabel]="editingId() === project.id ? 'Fermer' : 'Modifier'"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  [text]="true"
                  (onClick)="deleteProject(project)"
                  ariaLabel="Supprimer"
                />
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
            class="text-center py-12 text-muted text-sm bg-surface border border-foreground/10 rounded-xl"
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

  readonly projects = computed(() => [...(this.projectsResource.value() ?? [])]);
  readonly categories = computed(() => [...(this.categoriesResource.value() ?? ['Tous'])]);

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

  async onCreate(event: { data: Omit<Project, 'id'>; file: File | null }): Promise<void> {
    let created: Project;
    try {
      created = await firstValueFrom(this.projectsGateway.createProject(event.data));
    } catch {
      this.toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de la création du projet',
      });
      return;
    }

    if (event.file) {
      try {
        const key = await firstValueFrom(this.projectsGateway.uploadImage(event.file, created.id));
        created = { ...created, image: key };
      } catch (err) {
        console.warn('Project created, but image upload failed:', err);
        this.toast.add({
          severity: 'warn',
          summary: 'Attention',
          detail: 'Projet créé, mais upload image échoué. Réessayez via Modifier.',
        });
      }
    }

    this.projectsResource.update((list) => [...(list ?? []), created]);
    this.categoriesResource.reload();
    this.homeGateway.invalidateBundle();
    this.showNewForm.set(false);
    this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Projet créé' });
  }

  onUpdate(id: string, event: { data: Omit<Project, 'id'>; file: File | null }): void {
    const update$ = event.file
      ? this.projectsGateway
          .uploadImage(event.file, id)
          .pipe(
            switchMap((key) =>
              this.projectsGateway.updateProject(id, { ...event.data, image: key }),
            ),
          )
      : this.projectsGateway.updateProject(id, event.data);

    update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.projectsResource.update((list) =>
          (list ?? []).map((p) => (p.id === id ? updated : p)),
        );
        this.categoriesResource.reload();
        this.homeGateway.invalidateBundle();
        this.editingId.set(null);
        this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Projet mis à jour' });
      },
      error: () =>
        this.toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la mise à jour du projet',
        }),
    });
  }

  deleteProject(project: Project): void {
    // Optimistic update: retire le projet de la liste avant la réponse serveur
    const snapshot = this.projectsResource.value() ?? [];
    this.projectsResource.update((list) => (list ?? []).filter((p) => p.id !== project.id));

    this.projectsGateway
      .deleteProject(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.categoriesResource.reload();
          this.homeGateway.invalidateBundle();
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Projet supprimé' });
        },
        error: () => {
          // Réconciliation : restaure la liste en cas d'échec
          this.projectsResource.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression du projet',
          });
        },
      });
  }

}
