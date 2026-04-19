import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Diploma } from '@features/profile/domain';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-admin-diplomas',
  imports: [RouterLink, TableModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Diplômes</h1>
      <p-button
        label="Nouveau diplôme"
        icon="pi pi-plus"
        routerLink="/admin/content/diplomas/new"
      />
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
              <p-button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                [text]="true"
                [routerLink]="['/admin/content/diplomas', diploma.id, 'edit']"
                ariaLabel="Modifier"
              />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [text]="true"
                (onClick)="deleteDiploma(diploma)"
                ariaLabel="Supprimer"
              />
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminDiplomas {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(MessageService);
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
