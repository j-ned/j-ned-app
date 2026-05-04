import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Highlight } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import { AdminColText, AdminColMono, AdminColActions } from './components/admin-column';

@Component({
  selector: 'app-admin-highlights',
  imports: [AdminTable, AdminColText, AdminColMono, AdminColActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Points forts"
      newRoute="/admin/content/highlights/new"
      newLabel="Nouveau point fort"
      [items]="highlights()"
      [defaultSort]="{ key: 'title' }"
      emptyMessage="Aucun point fort"
    >
      <app-admin-col-text key="title" label="Titre" sortable bold [accessor]="title" />
      <app-admin-col-mono key="icon" label="Icône" [accessor]="icon" />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteHighlight($event)" />
    </app-admin-table>
  `,
})
export class AdminHighlights {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = (h: Highlight): string => h.title;
  protected readonly icon = (h: Highlight): string => h.icon;
  protected readonly editRoute = (h: Highlight): readonly string[] => [
    '/admin/content/highlights',
    h.id,
    'edit',
  ];

  private readonly highlightsRes = rxResource({
    stream: () => this.profileGateway.getHighlights(),
  });

  protected readonly highlights = computed(() => [...(this.highlightsRes.value() ?? [])]);

  protected deleteHighlight(highlight: Highlight): void {
    const snapshot = this.highlightsRes.value() ?? [];
    this.highlightsRes.update((list) => (list ?? []).filter((h) => h.id !== highlight.id));

    this.profileGateway
      .deleteHighlight(highlight.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Point fort supprimé',
          }),
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
