import { Component, DestroyRef, inject, signal, computed, viewChild } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project, ProjectKindFilter } from '@features/projects/domain/models/project.model';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { AdminProjectRow } from './components/admin-project-row';
import { ToastStore } from '@shared/ui/toast-store';
import { AppIcon } from '@shared/icons/app-icon';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { AdminPageHeader } from './components/admin-page-header';
import { projectsOverline } from './admin-page-copy';
import { toAdminProjectsView } from './admin-projects-view';

@Component({
  selector: 'app-admin-projects',
  imports: [
    RouterLink,
    AdminProjectRow,
    AppIcon,
    ConfirmDialog,
    FilterGroup,
    LoadError,
    AppSkeleton,
    AdminPageHeader,
  ],
  template: `
    <app-admin-page-header [overline]="overline()" heading="Projets">
      Ce que montrent Réalisations et l'accueil. L'ordre de la liste est l'ordre public, la nature
      décide de la section et du tampon.
      <div adminPageAside class="flex lg:justify-end">
        <a
          data-testid="admin-project-new"
          routerLink="/admin/projects/new"
          class="link-btn-primary"
        >
          <app-icon name="plus" [size]="16" />Nouveau projet
        </a>
      </div>
    </app-admin-page-header>

    @switch (listState()) {
      @case ('loading') {
        <div data-testid="admin-projects-loading" role="status" class="space-y-3">
          <span class="sr-only">Chargement des projets…</span>
          <app-skeleton class="block h-36 rounded-md" />
          <app-skeleton class="block h-36 rounded-md" />
          <app-skeleton class="block h-36 rounded-md" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="Les projets n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
          (retry)="projectsResource.reload()"
        />
      }
      @case ('empty') {
        <p
          data-testid="admin-projects-empty"
          class="rounded-xs border border-dashed border-line-strong px-5.5 py-14 text-center text-sm text-muted"
        >
          Aucun projet
        </p>
      }
      @default {
        <app-filter-group
          label="Filtrer par nature"
          [options]="view().filters"
          [(active)]="filter"
        />
        <ul data-testid="admin-projects-list" role="list">
          @for (row of view().rows; track row.id) {
            <li app-admin-project-row [row]="row" (deleteRequested)="requestDeletion(row.id)"></li>
          } @empty {
            <li class="py-12 text-center text-sm text-muted">Aucun projet de cette nature</li>
          }
        </ul>
      }
    }

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
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly filter = signal<ProjectKindFilter>('all');
  protected readonly pendingDeletion = signal<Project | null>(null);

  protected readonly deletionCopy = computed(() => {
    const title = this.pendingDeletion()?.title ?? '';
    return { heading: `Supprimer le projet ${title}\u202f?`, confirm: `Supprimer ${title}` };
  });

  protected readonly projectsResource = rxResource({
    stream: () => this.projectsGateway.getAllProjects(),
  });

  readonly projects = computed(() =>
    this.projectsResource.hasValue() ? [...this.projectsResource.value()] : [],
  );

  protected readonly listState = computed(() =>
    loadState(this.projectsResource, () => this.projects().length === 0),
  );

  protected readonly overline = computed(() =>
    this.projectsResource.hasValue() ? projectsOverline(this.projectsResource.value()) : '',
  );

  protected readonly view = computed(() => toAdminProjectsView(this.projects(), this.filter()));

  protected requestDeletion(id: string): void {
    this.pendingDeletion.set(this.projects().find((project) => project.id === id) ?? null);
  }

  protected confirmDeletion(): void {
    const project = this.pendingDeletion();
    this.pendingDeletion.set(null);
    this._pageHeader().focusTitle();
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
          this.homeGateway.invalidateBundle();
          this.projectsGateway.invalidateAllProjects();
          this.toast.add({ severity: 'success', detail: 'Projet supprimé' });
        },
        error: () => {
          // Réconciliation : restaure la liste en cas d'échec
          this.projectsResource.set(snapshot);
          this.toast.add({ severity: 'error', detail: 'Erreur lors de la suppression du projet' });
        },
      });
  }
}
