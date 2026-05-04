import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '@features/home/application';
import type { ServicePricing } from '@features/home/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import {
  AdminColText,
  AdminColNumber,
  AdminColBadge,
  AdminColToggle,
  AdminColActions,
} from './components/admin-column';

@Component({
  selector: 'app-admin-services',
  imports: [
    AdminTable,
    AdminColText,
    AdminColNumber,
    AdminColBadge,
    AdminColToggle,
    AdminColActions,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Prestations"
      newRoute="/admin/content/services/new"
      newLabel="Nouvelle prestation"
      [items]="services()"
      [defaultSort]="{ key: 'order' }"
      emptyMessage="Aucune prestation"
    >
      <app-admin-col-number key="order" label="Ordre" sortable [accessor]="order" />
      <app-admin-col-text key="title" label="Titre" sortable bold [accessor]="title" />
      <app-admin-col-text key="price" label="Prix" sortable [accessor]="price" />
      <app-admin-col-badge
        key="highlighted"
        label="Mis en avant"
        tone="accent"
        [accessor]="highlightedLabel"
      />
      <app-admin-col-toggle
        key="enabled"
        label="Active"
        [accessor]="enabled"
        (toggleChange)="toggleEnabled($event)"
      />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteService($event)" />
    </app-admin-table>
  `,
})
export class AdminServices {
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly order = (s: ServicePricing): number => s.order;
  protected readonly title = (s: ServicePricing): string => s.title;
  protected readonly price = (s: ServicePricing): string => s.price;
  protected readonly highlightedLabel = (s: ServicePricing): string | null =>
    s.highlighted ? 'Mis en avant' : null;
  protected readonly enabled = (s: ServicePricing): boolean => s.enabled;
  protected readonly editRoute = (s: ServicePricing): readonly string[] => [
    '/admin/content/services',
    s.id,
    'edit',
  ];

  private readonly servicesRes = rxResource({
    stream: () => this.homeGateway.getServicePricing(),
  });

  protected readonly services = computed(() => [...(this.servicesRes.value() ?? [])]);

  protected toggleEnabled(service: ServicePricing): void {
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

  protected deleteService(service: ServicePricing): void {
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
