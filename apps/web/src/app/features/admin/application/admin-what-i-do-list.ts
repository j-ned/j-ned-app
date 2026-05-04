import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { WhatIDo } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import { AdminColText, AdminColMuted, AdminColActions } from './components/admin-column';

@Component({
  selector: 'app-admin-what-i-do-list',
  imports: [AdminTable, AdminColText, AdminColMuted, AdminColActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Ce que je fais"
      newRoute="/admin/content/what-i-do/new"
      newLabel="Nouveau"
      [items]="items()"
      [defaultSort]="{ key: 'title' }"
      emptyMessage="Aucun élément"
    >
      <app-admin-col-text key="title" label="Titre" sortable bold [accessor]="title" />
      <app-admin-col-muted
        key="description"
        label="Description"
        truncate
        [accessor]="description"
      />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteItem($event)" />
    </app-admin-table>
  `,
})
export class AdminWhatIDoList {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = (i: WhatIDo): string => i.title;
  protected readonly description = (i: WhatIDo): string => i.description;
  protected readonly editRoute = (i: WhatIDo): readonly string[] => [
    '/admin/content/what-i-do',
    i.id,
    'edit',
  ];

  private readonly itemsRes = rxResource({
    stream: () => this.profileGateway.getWhatIDo(),
  });

  protected readonly items = computed(() => [...(this.itemsRes.value() ?? [])]);

  protected deleteItem(item: WhatIDo): void {
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
