import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '@core/auth/auth-store';
import { ToastStore } from '@shared/ui/toast-store';
import { Button } from '@shared/ui/button';
import { AppIconTile } from '@shared/ui/icon-tile';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-login',
  imports: [FormRoot, FormField, RouterLink, AppIcon, Button, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="min-h-[calc(100svh-5rem)] mt-20 flex items-center justify-center bg-background px-4 py-8"
    >
      <div class="w-full max-w-sm">
        <!-- Header -->
        <div class="text-center mb-8">
          <app-icon-tile size="lg" class="bg-primary/10 border border-primary/20 mb-4">
            <app-icon name="shield" [size]="28" class="text-primary" />
          </app-icon-tile>
          <h1 class="text-xl font-bold text-foreground">Connexion Admin</h1>
          <p class="text-muted text-sm mt-1">Accédez au tableau de bord</p>
        </div>

        <!-- Card -->
        <div class="bg-surface border border-foreground/10 rounded-2xl p-6">
          @if (errorMessage()) {
            <div
              class="mb-4 p-2.5 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
            >
              {{ errorMessage() }}
            </div>
          }

          <form [formRoot]="form">
            <fieldset class="border-0 p-0 m-0">
              <legend class="sr-only">Identifiants de connexion</legend>

              <!-- Email -->
              <div>
                @let emailField = form.email();
                <label for="email" class="form-label">Email</label>
                <div class="relative">
                  <app-icon
                    name="envelope"
                    [size]="16"
                    class="text-muted absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    id="email"
                    type="email"
                    [formField]="form.email"
                    autocomplete="email"
                    aria-required="true"
                    [attr.aria-invalid]="emailField.touched() && emailField.invalid()"
                    [attr.aria-describedby]="
                      emailField.touched() && emailField.invalid() ? 'login-email-error' : null
                    "
                    class="form-input pl-10"
                    placeholder="Votre email"
                  />
                </div>
                @if (emailField.touched() && emailField.invalid()) {
                  <p id="login-email-error" role="alert" class="form-error">
                    {{ emailField.errors()[0].message }}
                  </p>
                }
              </div>

              <!-- Password -->
              <div class="mt-3">
                @let password = form.password();
                <label for="password" class="form-label">Mot de passe</label>
                <div class="relative">
                  <app-icon
                    name="lock"
                    [size]="16"
                    class="text-muted absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    id="password"
                    type="password"
                    [formField]="form.password"
                    autocomplete="current-password"
                    aria-required="true"
                    [attr.aria-invalid]="password.touched() && password.invalid()"
                    [attr.aria-describedby]="
                      password.touched() && password.invalid() ? 'login-password-error' : null
                    "
                    class="form-input pl-10"
                    placeholder="Votre mot de passe"
                  />
                </div>
                @if (password.touched() && password.invalid()) {
                  <p id="login-password-error" role="alert" class="form-error">
                    {{ password.errors()[0].message }}
                  </p>
                }
              </div>
            </fieldset>

            <app-button
              type="submit"
              severity="primary"
              [block]="true"
              [disabled]="form().submitting()"
              class="mt-5"
            >
              @if (form().submitting()) {
                Connexion...
              } @else {
                Se connecter
              }
            </app-button>
          </form>
        </div>

        <!-- Footer -->
        <div class="mt-5 text-center">
          <a
            routerLink="/"
            class="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
          >
            <app-icon name="arrow-left" [size]="14" />
            Retour au site
          </a>
        </div>
      </div>
    </div>
  `,
})
export class Login {
  private readonly authService = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastStore);

  readonly errorMessage = signal('');

  private readonly _model = signal({ email: '', password: '' });

  readonly form = form(
    this._model,
    (path) => {
      required(path.email, { message: "L'email est obligatoire" });
      email(path.email, { message: "L'email n'est pas valide" });
      required(path.password, { message: 'Le mot de passe est obligatoire' });
      minLength(path.password, 6, {
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      });
    },
    { submission: { action: () => this.login() } },
  );

  private async login(): Promise<void> {
    this.errorMessage.set('');
    const { email, password } = this._model();
    try {
      const result = await firstValueFrom(this.authService.login(email, password));
      if (result === 'success') {
        await this.router.navigate(['/admin']);
      } else if (result === 'two-factor') {
        await this.router.navigate(['/two-factor']);
      } else {
        this.fail('Email ou mot de passe incorrect');
      }
    } catch {
      this.fail('Erreur de connexion au serveur');
    }
  }

  private fail(detail: string): void {
    this.errorMessage.set(detail);
    this.toast.add({ severity: 'error', summary: 'Erreur', detail });
  }
}
