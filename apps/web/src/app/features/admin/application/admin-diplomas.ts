import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { Diploma } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import { AdminColText, AdminColMuted, AdminColActions } from './components/admin-column';

@Component({
  selector: 'app-admin-diplomas',
  imports: [AdminTable, AdminColText, AdminColMuted, AdminColActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Diplômes"
      newRoute="/admin/content/diplomas/new"
      newLabel="Nouveau diplôme"
      [items]="diplomas()"
      [defaultSort]="{ key: 'title' }"
      emptyMessage="Aucun diplôme"
    >
      <app-admin-col-text key="title" label="Titre" sortable bold [accessor]="title" />
      <app-admin-col-muted key="provider" label="Organisme" sortable [accessor]="provider" />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteDiploma($event)" />
    </app-admin-table>
  `,
})
export class AdminDiplomas {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = (d: Diploma): string => d.title;
  protected readonly provider = (d: Diploma): string => d.provider;
  protected readonly editRoute = (d: Diploma): readonly string[] => [
    '/admin/content/diplomas',
    d.id,
    'edit',
  ];

  private readonly diplomasRes = rxResource({
    stream: () => this.profileGateway.getDiplomas(),
  });

  protected readonly diplomas = computed(() => [...(this.diplomasRes.value() ?? [])]);

  protected deleteDiploma(diploma: Diploma): void {
    const snapshot = this.diplomasRes.value() ?? [];
    this.diplomasRes.update((list) => (list ?? []).filter((d) => d.id !== diploma.id));

    this.profileGateway
      .deleteDiploma(diploma.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Diplôme supprimé',
          }),
        error: () => {
          this.diplomasRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
