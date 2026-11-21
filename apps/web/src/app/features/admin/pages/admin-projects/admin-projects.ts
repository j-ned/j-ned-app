import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project, ProjectKindFilter } from '@features/projects/domain/models/project.model';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { AdminProjectRow } from '../../application/components/admin-project-row';
import { Button } from '@shared/ui/button';
import { ToastStore } from '@core/notifications/toast-store';
import { AppIcon } from '@shared/icons/app-icon';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FilterGroup } from '@shared/ui/filter-group';
import { loadState, resourceValueOr } from '@shared/ui/load-state';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminListState } from '../../application/components/admin-list-state';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { projectsOverline } from '../../application/admin-page-copy';
import { toAdminProjectsView } from '../../application/admin-projects-view';
import { PendingDeletion } from '../../application/pending-deletion';

@Component({
  selector: 'app-admin-projects',
  imports: [
    RouterLink,
    AdminProjectRow,
    AppIcon,
    Button,
    ConfirmDialog,
    FilterGroup,
    AdminEmptyState,
    AdminListState,
    AdminPageHeader,
  ],
  template: `
    <app-admin-page-header [overline]="overline()" heading="Projets">
      Ce que montrent Réalisations et l'accueil. L'ordre de la liste est l'ordre public, la nature
      décide de la section et du tampon.
      <div adminPageAside class="flex lg:justify-end">
        <a appButton data-testid="admin-project-new" routerLink="/admin/projects/new">
          <app-icon name="plus" [size]="16" />Nouveau projet
        </a>
      </div>
    </app-admin-page-header>

    <app-admin-list-state
      [state]="listState()"
      testIdPrefix="admin-projects"
      loadingLabel="Chargement des projets…"
      errorMessage="Les projets n'ont pas pu être chargés. Vérifie ta connexion, puis réessaie."
      skeletonClass="h-36 rounded-md"
      (retry)="projectsResource.reload()"
    >
      <ng-template #listEmpty>
        <app-admin-empty-state data-testid="admin-projects-empty" stamp="Aucun projet" />
      </ng-template>
      <ng-template #listReady>
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
      </ng-template>
    </app-admin-list-state>

    <app-confirm-dialog
      [open]="deletion.target() !== null"
      [heading]="deletionCopy().heading"
      [confirmLabel]="deletionCopy().confirm"
      (confirmed)="confirmDeletion()"
      (cancelled)="deletion.cancel()"
    >
      <p>
        Le projet disparaît des Réalisations et de l'accueil dans la seconde, avec ses captures.
        Cette action est définitive.
      </p>
    </app-confirm-dialog>
  `,
})
export class AdminProjects {
  private readonly projectsGateway = inject(ProjectsGateway);
  private readonly homeGateway = inject(HomeGateway);
  private readonly toast = inject(ToastStore);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly filter = signal<ProjectKindFilter>('all');

  protected readonly projectsResource = rxResource({
    stream: () => this.projectsGateway.getAllProjects(),
  });

  readonly projects = computed(() => [...resourceValueOr(this.projectsResource, [])]);

  protected readonly listState = computed(() =>
    loadState(this.projectsResource, () => this.projects().length === 0),
  );

  protected readonly overline = computed(() =>
    this.projectsResource.hasValue() ? projectsOverline(this.projectsResource.value()) : '',
  );

  protected readonly view = computed(() => toAdminProjectsView(this.projects(), this.filter()));

  protected readonly deletion = new PendingDeletion<Project>({
    list: this.projectsResource,
    remove: (project): Observable<void> => this.projectsGateway.deleteProject(project.id),
    succeeded: (): void => {
      this.homeGateway.invalidateBundle();
      this.projectsGateway.invalidateAllProjects();
      this.toast.add({ severity: 'success', detail: 'Projet supprimé' });
    },
    failed: (): void =>
      this.toast.add({ severity: 'error', detail: 'Erreur lors de la suppression du projet' }),
  });

  protected readonly deletionCopy = computed(() => {
    const title = this.deletion.target()?.title ?? '';
    return { heading: `Supprimer le projet ${title}\u202f?`, confirm: `Supprimer ${title}` };
  });

  protected requestDeletion(id: string): void {
    const project = this.projects().find((candidate) => candidate.id === id);
    if (project) this.deletion.request(project);
  }

  protected confirmDeletion(): void {
    this.deletion.confirm();
    this._pageHeader().focusTitle();
  }

  deleteProject(project: Project): void {
    this.deletion.delete(project);
  }
}
