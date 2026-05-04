import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '@features/home/application';
import type { HomeHighlight } from '@features/home/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import {
  AdminColText,
  AdminColMono,
  AdminColNumber,
  AdminColActions,
} from './components/admin-column';

@Component({
  selector: 'app-admin-home-highlights',
  imports: [AdminTable, AdminColText, AdminColMono, AdminColNumber, AdminColActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Points forts (Accueil)"
      newRoute="/admin/content/home-highlights/new"
      newLabel="Nouveau point fort"
      [items]="highlights()"
      [defaultSort]="{ key: 'order' }"
      emptyMessage="Aucun point fort"
    >
      <app-admin-col-number key="order" label="Ordre" sortable [accessor]="order" />
      <app-admin-col-text key="title" label="Titre" sortable bold [accessor]="title" />
      <app-admin-col-mono key="icon" label="Icône" [accessor]="icon" />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteHighlight($event)" />
    </app-admin-table>
  `,
})
export class AdminHomeHighlights {
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly order = (h: HomeHighlight): number => h.order;
  protected readonly title = (h: HomeHighlight): string => h.title;
  protected readonly icon = (h: HomeHighlight): string => h.icon;
  protected readonly editRoute = (h: HomeHighlight): readonly string[] => [
    '/admin/content/home-highlights',
    h.id,
    'edit',
  ];

  private readonly highlightsRes = rxResource({
    stream: () => this.homeGateway.getHomeHighlights(),
  });

  protected readonly highlights = computed(() => [...(this.highlightsRes.value() ?? [])]);

  protected deleteHighlight(highlight: HomeHighlight): void {
    const snapshot = this.highlightsRes.value() ?? [];
    this.highlightsRes.update((list) => (list ?? []).filter((h) => h.id !== highlight.id));

    this.homeGateway
      .deleteHomeHighlight(highlight.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.homeGateway.invalidateBundle();
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Mise en avant supprimée',
          });
        },
        error: () => {
          this.highlightsRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
