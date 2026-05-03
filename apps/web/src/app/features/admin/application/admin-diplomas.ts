import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Diploma } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-admin-diplomas',
  imports: [RouterLink, TableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Diplômes</h1>
      <a routerLink="/admin/content/diplomas/new" class="btn-primary">
        <i class="pi pi-plus mr-2" aria-hidden="true"></i>
        Nouveau diplôme
      </a>
    </div>

    <p-table
      [value]="diplomas()"
      [paginator]="diplomas().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucun diplôme"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="title">Titre <p-sortIcon field="title" /></th>
          <th pSortableColumn="provider">Organisme <p-sortIcon field="provider" /></th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-diploma>
        <tr>
          <td class="font-medium text-foreground">{{ diploma.title }}</td>
          <td class="text-muted">{{ diploma.provider }}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <a
                [routerLink]="['/admin/content/diplomas', diploma.id, 'edit']"
                aria-label="Modifier"
                class="btn-outline"
              >
                <i class="pi pi-pencil" aria-hidden="true"></i>
              </a>
              <button
                type="button"
                (click)="deleteDiploma(diploma)"
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
export class AdminDiplomas {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly diplomasRes = rxResource({
    stream: () => this.profileGateway.getDiplomas(),
  });

  readonly diplomas = computed(() => [...(this.diplomasRes.value() ?? [])]);

  deleteDiploma(diploma: Diploma): void {
    const snapshot = this.diplomasRes.value() ?? [];
    this.diplomasRes.update((list) => (list ?? []).filter((d) => d.id !== diploma.id));

    this.profileGateway
      .deleteDiploma(diploma.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Diplôme supprimé',
          }),
        error: () => {
          this.diplomasRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
