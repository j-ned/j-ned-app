import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Technology } from '@features/profile/domain';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-technologies',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Technologies</h1>
      <a
        routerLink="/admin/about/technologies/new"
        class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Nouvelle technologie
      </a>
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Nom</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">
                Catégorie
              </th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Icône</th>
              <th scope="col" class="text-right px-6 py-4 text-sm font-medium text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            @for (tech of technologies(); track tech.id) {
              <tr class="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                <td class="px-6 py-4 text-sm text-foreground font-medium">{{ tech.name }}</td>
                <td class="px-6 py-4 text-sm text-muted">{{ tech.category }}</td>
                <td class="px-6 py-4 text-sm text-muted">{{ tech.icon }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a
                      [routerLink]="['/admin/about/technologies', tech.id, 'edit']"
                      class="px-3 py-1.5 text-xs rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      Modifier
                    </a>
                    <button
                      (click)="deleteTechnology(tech)"
                      class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-8 text-center text-muted text-sm">
                  Aucune technologie
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminTechnologies {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly technologiesRes = rxResource({
    stream: () => this.profileGateway.getTechnologies(),
  });

  readonly technologies = computed(() => this.technologiesRes.value() ?? []);

  deleteTechnology(tech: Technology): void {
    this.profileGateway
      .deleteTechnology(tech.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.technologiesRes.reload();
          this.toast.success('Technologie supprimée');
        },
        error: () => this.toast.error('Erreur lors de la suppression'),
      });
  }
}
