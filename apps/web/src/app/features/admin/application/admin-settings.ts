import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';
import type { ThemePreference } from '@core/theme/theme-preference';
import { ThemeStore } from '@core/theme/theme-store';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { AdminPageHeader } from './components/admin-page-header';
import { AdminSectionHead } from './components/admin-section-head';
import { AdminSettingRow } from './components/admin-setting-row';

const THEME_OPTIONS: readonly { readonly value: ThemePreference; readonly label: string }[] = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];

@Component({
  selector: 'app-admin-settings',
  imports: [RouterLink, AppIcon, Button, AdminPageHeader, AdminSectionHead, AdminSettingRow],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="email()" heading="Paramètres">
      Sécurité du compte et confort de l'administration.
    </app-admin-page-header>

    <section aria-labelledby="settings-security-heading">
      <app-admin-section-head heading="Sécurité" headingId="settings-security-heading" />
      <div app-admin-setting-row>
        <h3>Double authentification</h3>
        <p>
          Un code à six chiffres d'une application TOTP (1Password, Google Authenticator…) en plus
          du mot de passe.
        </p>
        <a
          appButton
          variant="outlined"
          data-testid="settings-two-factor-link"
          routerLink="/admin/settings/security"
          class="justify-self-start"
        >
          Configurer
        </a>
      </div>
      <div app-admin-setting-row>
        <h3>Session</h3>
        <p data-testid="settings-session">Connecté en tant que {{ email() }}.</p>
        <button
          appButton
          variant="outlined"
          type="button"
          data-testid="settings-logout"
          class="justify-self-start"
          (click)="logout()"
        >
          <app-icon name="sign-out" [size]="16" />
          Se déconnecter
        </button>
      </div>
    </section>

    <section class="mt-12" aria-labelledby="settings-appearance-heading">
      <app-admin-section-head heading="Apparence" headingId="settings-appearance-heading" />
      <fieldset app-admin-setting-row data-testid="theme-fieldset">
        <legend>Thème de l'administration</legend>
        <p data-testid="theme-hint">
          Le même réglage que sur le site public, enregistré dans ce navigateur.
        </p>
        <div class="flex gap-1 justify-self-start shadow-[inset_0_-1px_0_var(--color-line)]">
          @for (option of themeOptions; track option.value) {
            <label
              class="relative inline-flex min-h-11 cursor-pointer items-center border-b-2 border-transparent px-3 text-sm text-muted transition-colors hover:text-foreground has-checked:border-primary has-checked:font-semibold has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary"
            >
              <input
                type="radio"
                name="admin-theme"
                class="absolute inset-0 size-full cursor-pointer opacity-0"
                [attr.data-testid]="'theme-option-' + option.value"
                [value]="option.value"
                [checked]="preference() === option.value"
                (change)="choosePreference(option.value)"
              />
              {{ option.label }}
            </label>
          }
        </div>
      </fieldset>
    </section>
  `,
})
export class AdminSettings {
  private readonly _auth = inject(AuthStore);
  private readonly _theme = inject(ThemeStore);

  protected readonly themeOptions = THEME_OPTIONS;
  protected readonly email = computed(() => this._auth.currentUser()?.email ?? '');
  protected readonly preference = this._theme.preference;

  protected choosePreference(preference: ThemePreference): void {
    this._theme.setPreference(preference);
  }

  protected logout(): void {
    this._auth.logout();
  }
}
