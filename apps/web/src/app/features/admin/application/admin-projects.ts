import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  computed,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, switchMap } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type {
  Project,
  ProjectImage,
  ProjectInput,
} from '@features/projects/domain/models/project.model';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { AdminProjectInlineForm } from './components/admin-project-inline-form';
import { AdminProjectRow } from './components/admin-project-row';
import { ToastStore } from '@shared/ui/toast-store';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';

@Component({
  selector: 'app-admin-projects',
  imports: [
    AdminProjectInlineForm,
    AdminProjectRow,
    AppIcon,
    Button,
    ConfirmDialog,
    LoadError,
    AppSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1
          #pageTitle
          tabindex="-1"
          data-testid="admin-page-title"
          class="text-2xl font-bold text-foreground"
        >
          Projets
        </h1>
        <div class="flex flex-wrap items-center gap-3 sm:gap-4">
          <select
            class="app-select min-w-0 flex-1 sm:flex-none sm:min-w-44"
            [value]="selectedCategory()"
            (change)="selectCategory($event)"
            aria-label="Filtrer par catégorie"
          >
            <option value="Tous">Catégorie</option>
            @for (category of categories(); track category) {
              <option [value]="category">{{ category }}</option>
            }
          </select>
          <app-button
            [severity]="showNewForm() ? 'secondary' : 'primary'"
            [variant]="showNewForm() ? 'outlined' : 'solid'"
            (click)="toggleNewForm()"
          >
            @if (showNewForm()) {
              <app-icon name="times" [size]="20" />
            } @else {
              <app-icon name="plus" [size]="20" />
            }
            {{ showNewForm() ? 'Annuler' : 'Nouveau projet' }}
          </app-button>
        </div>
      </div>

      @if (showNewForm()) {
        <div class="mb-6">
          <app-admin-project-inline-form
            (saved)="createProject($event)"
            (cancelled)="showNewForm.set(false)"
          />
        </div>
      }

      @switch (listState()) {
        @case ('loading') {
          <div data-testid="admin-projects-loading" role="status" class="space-y-3">
            <span class="sr-only">Chargement des projets…</span>
            <app-skeleton class="block h-20 rounded-xl" />
            <app-skeleton class="block h-20 rounded-xl" />
            <app-skeleton class="block h-20 rounded-xl" />
          </div>
        }
        @case ('error') {
          <app-load-error
            message="Les projets n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
            (retry)="reloadList()"
          />
        }
        @case ('empty') {
          <p
            data-testid="admin-projects-empty"
            class="text-center py-12 text-muted text-sm bg-surface border border-foreground/10 rounded-xl"
          >
            Aucun projet
          </p>
        }
        @default {
          <div data-testid="admin-projects-list" class="space-y-3">
            @for (proj of filteredProjects(); track proj.id) {
              <app-admin-project-row
                [project]="proj"
                [isEditing]="editingId() === proj.id"
                (editToggled)="toggleEdit(proj.id)"
                (deleteClicked)="pendingDeletion.set(proj)"
                (saved)="updateProject(proj.id, $event)"
                (cancelled)="editingId.set(null)"
                (galleryChange)="updateGallery(proj.id, $event)"
              />
            } @empty {
              <p class="text-center py-12 text-muted text-sm">Aucun projet dans cette catégorie</p>
            }
          </div>
        }
      }
    </div>

    <app-confirm-dialog
      [open]="pendingDeletion() !== null"
      [heading]="deletionCopy().heading"
      [confirmLabel]="deletionCopy().confirm"
      (confirmed)="confirmDeletion()"
      (cancelled)="pendingDeletion.set(null)"
    >
      <p>
        Le projet disparaît des Réalisations et de l'accueil au prochain déploiement, avec ses
        captures. Cette action est définitive.
      </p>
    </app-confirm-dialog>
  `,
})
export class AdminProjects {
  private readonly projectsGateway = inject(ProjectsGateway);
  private readonly homeGateway = inject(HomeGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _pageTitle = viewChild.required<ElementRef<HTMLHeadingElement>>('pageTitle');

  readonly selectedCategory = signal('Tous');
  readonly editingId = signal<string | null>(null);
  readonly showNewForm = signal(false);
  protected readonly pendingDeletion = signal<Project | null>(null);

  protected readonly deletionCopy = computed(() => {
    const title = this.pendingDeletion()?.title ?? '';
    return { heading: `Supprimer le projet ${title}\u202f?`, confirm: `Supprimer ${title}` };
  });

  protected readonly projectsResource = rxResource({
    stream: () => this.projectsGateway.getAllProjects(),
  });

  private readonly categoriesResource = rxResource({
    stream: () => this.projectsGateway.getCategories(),
  });

  readonly projects = computed(() =>
    this.projectsResource.hasValue() ? [...this.projectsResource.value()] : [],
  );

  protected readonly listState = computed(() =>
    loadState(this.projectsResource, () => this.projects().length === 0),
  );
  readonly categories = computed(() =>
    this.categoriesResource.hasValue() ? [...this.categoriesResource.value()] : ['Tous'],
  );

  readonly filteredProjects = computed(() => {
    const cat = this.selectedCategory();
    const all = this.projects();
    if (!cat || cat === 'Tous') return all;
    return all.filter((p) => p.category === cat);
  });

  protected reloadList(): void {
    this.projectsResource.reload();
    this.categoriesResource.reload();
  }

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

  async createProject(event: { data: ProjectInput; file: File | null }): Promise<void> {
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
    this.projectsGateway.invalidateAllProjects();
    this.showNewForm.set(false);
    this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Projet créé' });
  }

  updateProject(id: string, event: { data: ProjectInput; file: File | null }): void {
    // uploadImage persiste déjà la nouvelle image côté backend ; le PATCH qui suit
    // ne met à jour que les autres champs (sans image).
    const update$ = event.file
      ? this.projectsGateway
          .uploadImage(event.file, id)
          .pipe(switchMap(() => this.projectsGateway.updateProject(id, event.data)))
      : this.projectsGateway.updateProject(id, event.data);

    update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.projectsResource.update((list) =>
          (list ?? []).map((p) => (p.id === id ? updated : p)),
        );
        this.categoriesResource.reload();
        this.homeGateway.invalidateBundle();
        this.projectsGateway.invalidateAllProjects();
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

  updateGallery(id: string, gallery: readonly ProjectImage[]): void {
    this.projectsResource.update((list) =>
      (list ?? []).map((p) => (p.id === id ? { ...p, gallery } : p)),
    );
    this.projectsGateway.invalidateAllProjects();
    this.homeGateway.invalidateBundle();
  }

  protected confirmDeletion(): void {
    const project = this.pendingDeletion();
    this.pendingDeletion.set(null);
    this._pageTitle().nativeElement.focus();
    if (project) this.deleteProject(project);
  }

  deleteProject(project: Project): void {
    // Optimistic update: retire le projet de la liste avant la réponse serveur
    const snapshot = this.projects();
    this.projectsResource.update((list) => (list ?? []).filter((p) => p.id !== project.id));

    this.projectsGateway
      .deleteProject(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.categoriesResource.reload();
          this.homeGateway.invalidateBundle();
          this.projectsGateway.invalidateAllProjects();
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

  protected selectCategory(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }
}
