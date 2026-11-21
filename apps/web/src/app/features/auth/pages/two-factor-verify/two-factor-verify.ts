import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore, type TwoFactorOutcome } from '@core/auth/auth-store';
import { AppIcon } from '@shared/icons/app-icon';
import { StatusMessage } from '@shared/ui/status-message';
import { Button } from '@shared/ui/button';
import { AppIconTile } from '@shared/ui/icon-tile';
import { FieldError } from '@shared/ui/field-error';

const TOTP_PATTERN = /^\d{6}$/;

const VERIFICATION_FAILURE_MESSAGES = {
  'invalid-code': 'Code invalide ou expiré, réessaie ou reconnecte-toi',
  throttled: 'Trop de tentatives, réessaie dans quelques minutes',
  error: 'Vérification impossible pour le moment, réessaie dans un instant',
} satisfies Record<Exclude<TwoFactorOutcome, 'success'>, string>;

@Component({
  selector: 'app-two-factor-verify',
  imports: [
    StatusMessage,
    FormRoot,
    FormField,
    RouterLink,
    AppIcon,
    Button,
    AppIconTile,
    FieldError,
  ],
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
          <app-status-message tone="error" class="mb-6">
            {{ errorMessage() }}
          </app-status-message>
        }

        <form [formRoot]="form" data-testid="two-factor-form" class="space-y-5">
          <div>
            @let codeInError = form.code().touched() && form.code().invalid();
            <label for="code" class="form-label">Code TOTP</label>
            <input
              id="code"
              type="text"
              [formField]="form.code"
              autocomplete="one-time-code"
              inputmode="numeric"
              aria-required="true"
              [attr.aria-invalid]="codeInError"
              [attr.aria-describedby]="codeInError ? 'twofa-code-error' : null"
              class="form-input text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
            />
            <app-field-error [field]="form.code" errorId="twofa-code-error" />
          </div>

          <button appButton type="submit" [block]="true" [disabled]="form().submitting()">
            @if (form().submitting()) {
              Vérification...
            } @else {
              Vérifier
            }
          </button>
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
      const result = await firstValueFrom(
        this.authService.verifyTwoFactor(challengeToken, this._model().code),
      );
      if (result === 'success') {
        await this.router.navigate(['/admin']);
      } else {
        this.errorMessage.set(VERIFICATION_FAILURE_MESSAGES[result]);
      }
    } catch {
      this.errorMessage.set('Erreur de vérification');
    }
  }
}
