import { Component, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import type { SocialButton } from '@features/profile/domain';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-social-buttons',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-foreground">Boutons sociaux</h1>
      <a
        routerLink="/admin/about/social-buttons/new"
        class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Nouveau bouton
      </a>
    </div>

    <div class="bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-foreground/10">
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Label</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Icône</th>
              <th scope="col" class="text-left px-6 py-4 text-sm font-medium text-muted">Lien</th>
              <th scope="col" class="text-right px-6 py-4 text-sm font-medium text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            @for (btn of buttons(); track btn.id) {
              <tr class="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                <td class="px-6 py-4 text-sm text-foreground font-medium">{{ btn.label }}</td>
                <td class="px-6 py-4 text-sm text-muted">{{ btn.icon }}</td>
                <td class="px-6 py-4 text-sm text-muted max-w-xs truncate">{{ btn.href }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a
                      [routerLink]="['/admin/about/social-buttons', btn.id, 'edit']"
                      class="px-3 py-1.5 text-xs rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      Modifier
                    </a>
                    <button
                      (click)="deleteButton(btn)"
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
                  Aucun bouton social
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminSocialButtons {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly buttonsRes = rxResource({
    stream: () => this.profileGateway.getSocialButtons(),
  });

  readonly buttons = (): readonly SocialButton[] => this.buttonsRes.value() ?? [];

  deleteButton(btn: SocialButton): void {
    this.profileGateway
      .deleteSocialButton(btn.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.buttonsRes.reload();
          this.toast.success('Réseau social supprimé');
        },
        error: () => this.toast.error('Erreur lors de la suppression'),
      });
  }
}
