import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Technology } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import {
  AdminColText,
  AdminColMuted,
  AdminColMono,
  AdminColActions,
} from './components/admin-column';

@Component({
  selector: 'app-admin-technologies',
  imports: [AdminTable, AdminColText, AdminColMuted, AdminColMono, AdminColActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Technologies"
      newRoute="/admin/content/technologies/new"
      newLabel="Nouvelle technologie"
      [items]="technologies()"
      [defaultSort]="{ key: 'name' }"
      emptyMessage="Aucune technologie"
    >
      <app-admin-col-text key="name" label="Nom" sortable bold [accessor]="name" />
      <app-admin-col-muted key="category" label="Catégorie" sortable [accessor]="category" />
      <app-admin-col-mono key="icon" label="Icône" [accessor]="icon" />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteTechnology($event)" />
    </app-admin-table>
  `,
})
export class AdminTechnologies {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly name = (t: Technology): string => t.name;
  protected readonly category = (t: Technology): string => t.category;
  protected readonly icon = (t: Technology): string => t.icon;
  protected readonly editRoute = (t: Technology): readonly string[] => [
    '/admin/content/technologies',
    t.id,
    'edit',
  ];

  private readonly technologiesRes = rxResource({
    stream: () => this.profileGateway.getTechnologies(),
  });

  protected readonly technologies = computed(() => [...(this.technologiesRes.value() ?? [])]);

  protected deleteTechnology(tech: Technology): void {
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
