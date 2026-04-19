import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import type { HomeHighlight } from '@features/home/domain';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-admin-home-highlights',
  imports: [RouterLink, TableModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Points forts (Accueil)</h1>
      <p-button
        label="Nouveau point fort"
        icon="pi pi-plus"
        routerLink="/admin/content/home-highlights/new"
      />
    </div>

    <p-table
      [value]="highlights()"
      [paginator]="highlights().length > 10"
      [rows]="10"
      [rowHover]="true"
      dataKey="id"
      emptyMessage="Aucun point fort"
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="order">Ordre <p-sortIcon field="order" /></th>
          <th pSortableColumn="title">Titre <p-sortIcon field="title" /></th>
          <th>Icône</th>
          <th class="text-right">Actions</th>
        </tr>
      </ng-template>
      <ng-template #body let-highlight>
        <tr>
          <td class="text-muted">{{ highlight.order }}</td>
          <td class="font-medium text-foreground">{{ highlight.title }}</td>
          <td class="text-muted">{{ highlight.icon }}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <p-button
                icon="pi pi-pencil"
                severity="secondary"
                size="small"
                [text]="true"
                [routerLink]="['/admin/content/home-highlights', highlight.id, 'edit']"
                ariaLabel="Modifier"
              />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                [text]="true"
                (onClick)="deleteHighlight(highlight)"
                ariaLabel="Supprimer"
              />
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminHomeHighlights {
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly highlightsRes = rxResource({
    stream: () => this.homeGateway.getHomeHighlights(),
  });

  readonly highlights = computed(() => [...(this.highlightsRes.value() ?? [])]);

  deleteHighlight(highlight: HomeHighlight): void {
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
