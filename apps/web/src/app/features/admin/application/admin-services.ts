import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HOME_GATEWAY } from '@features/home/application';
import type { ServicePricing } from '@features/home/domain';
import { ToastService } from '@shared/ui';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'app-admin-services',
  imports: [RouterLink, FormsModule, TableModule, Button, Tag, ToggleSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Prestations</h1>
      <p-button
        label="Nouvelle prestation"
        icon="pi pi-plus"
        routerLink="/admin/content/services/new"
      />
    </div>

    <p-table
      [value]="services()"
      [paginator]="services().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucune prestation"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="order">Ordre <p-sortIcon field="order" /></th>
          <th pSortableColumn="title">Titre <p-sortIcon field="title" /></th>
          <th pSortableColumn="price">Prix <p-sortIcon field="price" /></th>
          <th>Mis en avant</th>
          <th>Active</th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-service>
        <tr>
          <td class="text-muted">{{ service.order }}</td>
          <td class="font-medium text-foreground">{{ service.title }}</td>
          <td class="text-primary font-medium">{{ service.price }}</td>
          <td>
            @if (service.highlighted) {
              <p-tag value="Oui" severity="info" />
            } @else {
              <span class="text-muted">Non</span>
            }
          </td>
          <td>
            <p-toggleswitch
              [ngModel]="service.enabled"
              (ngModelChange)="toggleEnabled(service)"
              [ariaLabel]="service.enabled ? 'Désactiver' : 'Activer'"
            />
          </td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <p-button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                [text]="true"
                [routerLink]="['/admin/content/services', service.id, 'edit']"
                ariaLabel="Modifier"
              />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [text]="true"
                (onClick)="deleteService(service)"
                ariaLabel="Supprimer"
              />
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminServices {
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly servicesRes = rxResource({
    stream: () => this.homeGateway.getServicePricing(),
  });

  readonly services = computed(() => [...(this.servicesRes.value() ?? [])]);

  toggleEnabled(service: ServicePricing): void {
    this.homeGateway
      .updateServicePricing(service.id, { enabled: !service.enabled })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.servicesRes.update((list) =>
            (list ?? []).map((s) => (s.id === service.id ? updated : s)),
          );
          this.homeGateway.invalidateBundle();
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: service.enabled ? 'Prestation désactivée' : 'Prestation activée',
          });
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour',
          }),
      });
  }

  deleteService(service: ServicePricing): void {
    const snapshot = this.servicesRes.value() ?? [];
    this.servicesRes.update((list) => (list ?? []).filter((s) => s.id !== service.id));

    this.homeGateway
      .deleteServicePricing(service.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.homeGateway.invalidateBundle();
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Prestation supprimée',
          });
        },
        error: () => {
          this.servicesRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
