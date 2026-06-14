import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { AppIconTile } from '@shared/ui/icon-tile';

@Component({
  selector: 'app-admin-settings',
  imports: [RouterLink, AppIcon, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Paramètres</h1>
      <p class="text-sm text-muted">Sécurité du compte</p>
    </header>

    <section class="mb-10">
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
      >
        Sécurité du compte
      </h2>
      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <app-icon-tile class="bg-primary/10">
              <app-icon name="shield" [size]="20" class="text-primary" />
            </app-icon-tile>
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Authentification à deux facteurs
              </h3>
              <p class="text-xs text-muted leading-relaxed mt-1">
                Protéger votre compte admin avec une app TOTP (Google Authenticator, 1Password…)
              </p>
            </div>
          </div>
          <a
            routerLink="/admin/settings/security"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-muted/30 bg-transparent px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            <app-icon name="cog" [size]="20" />
            Configurer
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AdminSettings {}
