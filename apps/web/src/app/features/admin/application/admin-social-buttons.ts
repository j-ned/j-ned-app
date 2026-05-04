import { Component, DestroyRef, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { SocialButton } from '@features/profile/domain';
import { ToastService } from '@shared/ui';
import { AdminTable } from './components/admin-table';
import {
  AdminColText,
  AdminColMono,
  AdminColMuted,
  AdminColActions,
} from './components/admin-column';

@Component({
  selector: 'app-admin-social-buttons',
  imports: [AdminTable, AdminColText, AdminColMono, AdminColMuted, AdminColActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-table
      title="Boutons sociaux"
      newRoute="/admin/content/social/new"
      newLabel="Nouveau bouton"
      [items]="buttons()"
      [defaultSort]="{ key: 'label' }"
      emptyMessage="Aucun bouton social"
    >
      <app-admin-col-text key="label" label="Label" sortable bold [accessor]="label" />
      <app-admin-col-mono key="icon" label="Icône" [accessor]="icon" />
      <app-admin-col-muted key="href" label="Lien" truncate [accessor]="href" />
      <app-admin-col-actions [editRoute]="editRoute" (delete)="deleteButton($event)" />
    </app-admin-table>
  `,
})
export class AdminSocialButtons {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly label = (b: SocialButton): string => b.label;
  protected readonly icon = (b: SocialButton): string => b.icon;
  protected readonly href = (b: SocialButton): string => b.href;
  protected readonly editRoute = (b: SocialButton): readonly string[] => [
    '/admin/content/social',
    b.id,
    'edit',
  ];

  private readonly buttonsRes = rxResource({
    stream: () => this.profileGateway.getSocialButtons(),
  });

  protected readonly buttons = computed(() => [...(this.buttonsRes.value() ?? [])]);

  protected deleteButton(btn: SocialButton): void {
    const snapshot = this.buttonsRes.value() ?? [];
    this.buttonsRes.update((list) => (list ?? []).filter((b) => b.id !== btn.id));

    this.profileGateway
      .deleteSocialButton(btn.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Réseau social supprimé',
          }),
        error: () => {
          this.buttonsRes.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la suppression',
          });
        },
      });
  }
}
