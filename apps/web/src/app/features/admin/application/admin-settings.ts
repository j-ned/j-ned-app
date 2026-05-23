import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-admin-settings',
  imports: [RouterLink, AppIcon],
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
            <div class="icon-tile bg-primary/10">
              <app-icon name="shield" [size]="20" class="text-primary" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Authentification à deux facteurs
              </h3>
              <p class="text-xs text-muted leading-relaxed mt-1">
                Protéger votre compte admin avec une app TOTP (Google Authenticator, 1Password…)
              </p>
            </div>
          </div>
          <a routerLink="/admin/settings/security" class="btn-outline">
            <app-icon name="cog" [size]="20" class="mr-2" />
            Configurer
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AdminSettings {}
