import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { WhatIDo } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-admin-what-i-do-list',
  imports: [RouterLink, TableModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Ce que je fais</h1>
      <p-button label="Nouveau" icon="pi pi-plus" routerLink="/admin/content/what-i-do/new" />
    </div>

    <p-table
      [value]="items()"
      [paginator]="items().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucun élément"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="title">Titre <p-sortIcon field="title" /></th>
          <th>Description</th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-item>
        <tr>
          <td class="font-medium text-foreground">{{ item.title }}</td>
          <td class="text-muted max-w-xs truncate">{{ item.description }}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <p-button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                [text]="true"
                [routerLink]="['/admin/content/what-i-do', item.id, 'edit']"
                ariaLabel="Modifier"
              />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [text]="true"
                (onClick)="deleteItem(item)"
                ariaLabel="Supprimer"
              />
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminWhatIDoList {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly itemsRes = rxResource({
    stream: () => this.profileGateway.getWhatIDo(),
  });

  readonly items = computed(() => [...(this.itemsRes.value() ?? [])]);

  deleteItem(item: WhatIDo): void {
    const snapshot = this.itemsRes.value() ?? [];
    this.itemsRes.update((list) => (list ?? []).filter((i) => i.id !== item.id));

    this.profileGateway
      .deleteWhatIDo(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Compétence supprimée',
          }),
        error: () => {
          this.itemsRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
