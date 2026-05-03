import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { SocialButton } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-admin-social-buttons',
  imports: [RouterLink, TableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Boutons sociaux</h1>
      <a routerLink="/admin/content/social/new" class="btn-primary">
        <i class="pi pi-plus mr-2" aria-hidden="true"></i>
        Nouveau bouton
      </a>
    </div>

    <p-table
      [value]="buttons()"
      [paginator]="buttons().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucun bouton social"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="label">Label <p-sortIcon field="label" /></th>
          <th>Icône</th>
          <th>Lien</th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-btn>
        <tr>
          <td class="font-medium text-foreground">{{ btn.label }}</td>
          <td class="text-muted">{{ btn.icon }}</td>
          <td class="text-muted max-w-xs truncate">{{ btn.href }}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <a
                [routerLink]="['/admin/content/social', btn.id, 'edit']"
                aria-label="Modifier"
                class="btn-outline"
              >
                <i class="pi pi-pencil" aria-hidden="true"></i>
              </a>
              <button
                type="button"
                (click)="deleteButton(btn)"
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
export class AdminSocialButtons {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly buttonsRes = rxResource({
    stream: () => this.profileGateway.getSocialButtons(),
  });

  readonly buttons = computed(() => [...(this.buttonsRes.value() ?? [])]);

  deleteButton(btn: SocialButton): void {
    const snapshot = this.buttonsRes.value() ?? [];
    this.buttonsRes.update((list) => (list ?? []).filter((b) => b.id !== btn.id));

    this.profileGateway
      .deleteSocialButton(btn.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Réseau social supprimé',
          }),
        error: () => {
          this.buttonsRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
