import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Button } from 'primeng/button';
import { SiteSettingsService } from '@core/services';

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule, RouterLink, ToggleSwitch, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Paramètres</h1>
      <p class="text-sm text-muted">Sécurité du compte et visibilité des fonctionnalités</p>
    </header>

    <!-- Sécurité -->
    <section class="mb-10">
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
      >
        Sécurité du compte
      </h2>
      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div
              class="w-11 h-11 shrink-0 rounded-lg bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center"
            >
              <i class="pi pi-shield text-xl text-primary" aria-hidden="true"></i>
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
          <p-button
            label="Configurer"
            icon="pi pi-cog"
            severity="secondary"
            [outlined]="true"
            routerLink="/admin/settings/security"
          />
        </div>
      </div>
    </section>

    <!-- Feature toggles -->
    <section>
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
      >
        Visibilité des sections
      </h2>
      <div class="bg-surface border border-foreground/10 rounded-xl p-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div
              [class]="
                'w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-colors ' +
                (siteSettings.blogEnabled()
                  ? 'bg-linear-to-br from-primary/15 to-primary/5'
                  : 'bg-linear-to-br from-foreground/10 to-foreground/5')
              "
            >
              <i
                [class]="
                  'pi pi-pencil text-xl ' +
                  (siteSettings.blogEnabled() ? 'text-primary' : 'text-muted')
                "
                aria-hidden="true"
              ></i>
            </div>
            <div>
              <h3 class="text-base font-semibold text-foreground">Blog</h3>
              <p class="text-xs text-muted leading-relaxed mt-1">
                {{
                  siteSettings.blogEnabled()
                    ? 'Le blog est visible dans la navigation du site.'
                    : "Le blog est masqué : la rubrique n'apparaît pas dans la navigation."
                }}
              </p>
            </div>
          </div>
          <p-toggleswitch
            [ngModel]="siteSettings.blogEnabled()"
            (ngModelChange)="siteSettings.toggleBlog()"
            [ariaLabel]="siteSettings.blogEnabled() ? 'Désactiver le blog' : 'Activer le blog'"
          />
        </div>
      </div>
    </section>
  `,
})
export class AdminSettings {
  readonly siteSettings = inject(SiteSettingsService);
}
