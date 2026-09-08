import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '@core/auth/auth-store';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { AppIconTile } from '@shared/ui/icon-tile';

const TOTP_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-two-factor-verify',
  imports: [FormRoot, FormField, RouterLink, AppIcon, Button, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="min-h-[calc(100svh-5rem)] mt-20 flex items-center justify-center bg-background px-4 py-8"
    >
      <div class="w-full max-w-md bg-surface border border-foreground/10 rounded-2xl p-8">
        <div class="flex justify-center mb-6">
          <app-icon-tile size="lg" class="bg-primary/10 border border-primary/20">
            <app-icon name="shield" [size]="28" class="text-primary" />
          </app-icon-tile>
        </div>

        <h1 class="text-2xl font-bold text-foreground mb-2 text-center">Vérification 2FA</h1>
        <p class="text-muted text-sm text-center mb-8">
          Entrez le code à 6 chiffres de votre application d'authentification
        </p>

        @if (errorMessage()) {
          <div
            class="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
          >
            {{ errorMessage() }}
          </div>
        }

        <form [formRoot]="form" class="space-y-5">
          <div>
            @let code = form.code();
            <label for="code" class="form-label">Code TOTP</label>
            <input
              id="code"
              type="text"
              [formField]="form.code"
              autocomplete="one-time-code"
              inputmode="numeric"
              aria-required="true"
              [attr.aria-invalid]="code.touched() && code.invalid()"
              [attr.aria-describedby]="code.touched() && code.invalid() ? 'twofa-code-error' : null"
              class="form-input text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
            />
            @if (code.touched() && code.invalid()) {
              <p id="twofa-code-error" role="alert" class="form-error">
                {{ code.errors()[0].message }}
              </p>
            }
          </div>

          <app-button
            type="submit"
            severity="primary"
            [block]="true"
            [disabled]="form().submitting()"
          >
            @if (form().submitting()) {
              Vérification...
            } @else {
              Vérifier
            }
          </app-button>
        </form>

        <nav class="mt-6 text-center">
          <a
            routerLink="/login"
            class="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary transition-colors"
          >
            Retour à la connexion
          </a>
        </nav>
      </div>
    </div>
  `,
})
export class TwoFactorVerify {
  private readonly authService = inject(AuthStore);
  private readonly router = inject(Router);

  readonly errorMessage = signal('');

  private readonly _model = signal({ code: '' });

  readonly form = form(
    this._model,
    (path) => {
      required(path.code, { message: 'Le code est obligatoire' });
      pattern(path.code, TOTP_PATTERN, { message: 'Le code doit contenir 6 chiffres' });
    },
    { submission: { action: () => this.verify() } },
  );

  private async verify(): Promise<void> {
    const challengeToken = this.authService.pendingChallengeToken();
    if (!challengeToken) {
      await this.router.navigate(['/login']);
      return;
    }

    this.errorMessage.set('');
    try {
      const success = await firstValueFrom(
        this.authService.verifyTwoFactor(challengeToken, this._model().code),
      );
      if (success) {
        await this.router.navigate(['/admin']);
      } else {
        this.errorMessage.set('Code invalide');
      }
    } catch {
      this.errorMessage.set('Erreur de vérification');
    }
  }
}
