import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import type { ServicePricing } from '@features/home/domain';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-services',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Prestations</h1>
      <a
        routerLink="/admin/home/services/new"
        class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Nouvelle prestation
      </a>
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Ordre</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Titre</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Prix</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">
                Mis en avant
              </th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Active</th>
              <th scope="col" class="text-right px-6 py-4 text-sm font-medium text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            @for (service of services(); track service.id) {
              <tr class="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                <td class="px-6 py-4 text-sm text-muted">{{ service.order }}</td>
                <td class="px-6 py-4 text-sm text-foreground font-medium">{{ service.title }}</td>
                <td class="px-6 py-4 text-sm text-primary font-medium">{{ service.price }}</td>
                <td class="px-6 py-4 text-sm">
                  @if (service.highlighted) {
                    <span class="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">Oui</span>
                  } @else {
                    <span class="text-muted">Non</span>
                  }
                </td>
                <td class="px-6 py-4">
                  <button
                    (click)="toggleEnabled(service)"
                    [class]="
                      'relative w-10 h-6 rounded-full transition-colors duration-200 ' +
                      (service.enabled ? 'bg-green-500' : 'bg-foreground/20')
                    "
                    [attr.aria-label]="service.enabled ? 'Désactiver' : 'Activer'"
                  >
                    <span
                      [class]="
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ' +
                        (service.enabled ? 'translate-x-4' : 'translate-x-0')
                      "
                    ></span>
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a
                      [routerLink]="['/admin/home/services', service.id, 'edit']"
                      class="px-3 py-1.5 text-xs rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      Modifier
                    </a>
                    <button
                      (click)="deleteService(service)"
                      class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-muted text-sm">
                  Aucune prestation
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminServices {
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly servicesRes = rxResource({
    stream: () => this.homeGateway.getServicePricing(),
  });

  readonly services = computed(() => this.servicesRes.value() ?? []);

  toggleEnabled(service: ServicePricing): void {
    this.homeGateway
      .updateServicePricing(service.id, { enabled: !service.enabled })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.servicesRes.reload();
          this.homeGateway.invalidateBundle();
          this.toast.success(service.enabled ? 'Prestation désactivée' : 'Prestation activée');
        },
        error: () => this.toast.error('Erreur lors de la mise à jour'),
      });
  }

  deleteService(service: ServicePricing): void {
    this.homeGateway
      .deleteServicePricing(service.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.servicesRes.reload();
          this.homeGateway.invalidateBundle();
          this.toast.success('Prestation supprimée');
        },
        error: () => this.toast.error('Erreur lors de la suppression'),
      });
  }
}
