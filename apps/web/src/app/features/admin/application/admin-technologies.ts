import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Technology } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-admin-technologies',
  imports: [RouterLink, TableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Technologies</h1>
      <a routerLink="/admin/content/technologies/new" class="btn-primary">
        <i class="pi pi-plus mr-2" aria-hidden="true"></i>
        Nouvelle technologie
      </a>
    </div>

    <p-table
      [value]="technologies()"
      [paginator]="technologies().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucune technologie"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="name">Nom <p-sortIcon field="name" /></th>
          <th pSortableColumn="category">Catégorie <p-sortIcon field="category" /></th>
          <th>Icône</th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-tech>
        <tr>
          <td class="font-medium text-foreground">{{ tech.name }}</td>
          <td class="text-muted">{{ tech.category }}</td>
          <td class="text-muted">{{ tech.icon }}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <a
                [routerLink]="['/admin/content/technologies', tech.id, 'edit']"
                aria-label="Modifier"
                class="btn-outline"
              >
                <i class="pi pi-pencil" aria-hidden="true"></i>
              </a>
              <button
                type="button"
                (click)="deleteTechnology(tech)"
                aria-label="Supprimer"
                class="btn-danger"
              >
                <i class="pi pi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminTechnologies {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly technologiesRes = rxResource({
    stream: () => this.profileGateway.getTechnologies(),
  });

  readonly technologies = computed(() => [...(this.technologiesRes.value() ?? [])]);

  deleteTechnology(tech: Technology): void {
    const snapshot = this.technologiesRes.value() ?? [];
    this.technologiesRes.update((list) => (list ?? []).filter((t) => t.id !== tech.id));

    this.profileGateway
      .deleteTechnology(tech.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Technologie supprimée',
          }),
        error: () => {
          this.technologiesRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
