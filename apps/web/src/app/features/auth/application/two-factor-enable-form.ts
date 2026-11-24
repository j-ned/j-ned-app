import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, pattern, required } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { StatusMessage } from '@shared/ui/status-message';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { PASSWORD_MIN_LENGTH } from '@features/auth/domain/models/password-policy';

// L'API exige le mot de passe pour lier un authentificateur : une session seule ne suffit pas.
export type TwoFactorEnableRequest = { readonly password: string; readonly code: string };

const EMPTY = { password: '', code: '' };
const TOTP_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-two-factor-enable-form',
  imports: [StatusMessage, FormRoot, FormField, AppIcon, Button, FieldError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-background/80 border border-foreground/10 rounded-2xl p-8">
      <div class="flex items-center gap-3 mb-2">
        <app-icon name="shield" [size]="20" class="text-primary" />
        <h2 class="text-xl font-bold text-foreground">Authentification à deux facteurs</h2>
      </div>

      @if (successMessage()) {
        <app-status-message tone="success" class="mb-6">
          {{ successMessage() }}
        </app-status-message>
      }

      @if (errorMessage()) {
        <app-status-message tone="error" class="mb-6">
          {{ errorMessage() }}
        </app-status-message>
      }

      @if (qrCodeUrl()) {
        <p class="text-muted text-sm mb-6">
          Renforce la sécurité de ton compte avec une application d'authentification (Google
          Authenticator, Authy, 1Password, etc.)
        </p>

        <div class="space-y-6">
          <div class="text-center">
            <p class="text-sm text-muted mb-4">
              Scanne ce QR code avec ton application d'authentification :
            </p>
            <div class="inline-block p-4 bg-white rounded-xl">
              <img
                [src]="qrCodeUrl()"
                alt="QR code à scanner avec ton application d'authentification"
                width="192"
                height="192"
                class="w-48 h-48"
              />
            </div>
          </div>

          @if (secret()) {
            <div>
              <p class="text-sm text-muted mb-1">Ou entre ce code manuellement :</p>
              <code
                class="block w-full p-3 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground text-center font-mono text-sm tracking-wider select-all"
              >
                {{ secret() }}
              </code>
            </div>
          }

          <form [formRoot]="tfaForm" class="space-y-4">
            <div>
              @let passwordInError = tfaForm.password().touched() && tfaForm.password().invalid();
              <label for="totp-password" class="form-label">Mot de passe</label>
              <input
                id="totp-password"
                data-testid="twofa-setup-password"
                type="password"
                [formField]="tfaForm.password"
                autocomplete="current-password"
                aria-required="true"
                [attr.aria-invalid]="passwordInError"
                [attr.aria-describedby]="passwordInError ? 'twofa-setup-password-error' : null"
                class="form-input"
                placeholder="Ton mot de passe"
              />
              <app-field-error [field]="tfaForm.password" errorId="twofa-setup-password-error" />
            </div>
            <div>
              @let codeInError = tfaForm.code().touched() && tfaForm.code().invalid();
              <label for="totp-code" class="form-label">Code de vérification</label>
              <input
                id="totp-code"
                data-testid="twofa-setup-code"
                type="text"
                [formField]="tfaForm.code"
                autocomplete="one-time-code"
                inputmode="numeric"
                aria-required="true"
                [attr.aria-invalid]="codeInError"
                [attr.aria-describedby]="codeInError ? 'twofa-setup-code-error' : null"
                class="form-input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
              <app-field-error [field]="tfaForm.code" errorId="twofa-setup-code-error" />
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              @if (reconfiguring()) {
                <button
                  appButton
                  type="button"
                  variant="outlined"
                  [block]="true"
                  class="sm:flex-1"
                  data-testid="twofa-reconfigure-cancel"
                  (click)="cancelled.emit()"
                >
                  Annuler
                </button>
              }
              <button
                type="submit"
                data-testid="twofa-submit"
                [disabled]="loading()"
                class="w-full sm:flex-1 min-h-11 py-2.5 px-4 rounded-lg bg-status-success hover:bg-status-success/90 text-on-status-success font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                @if (loading()) {
                  Activation...
                } @else if (reconfiguring()) {
                  Confirmer la nouvelle application
                } @else {
                  Activer le 2FA
                }
              </button>
            </div>
          </form>
        </div>
      } @else {
        <p class="text-muted text-sm mb-6">
          Renforce la sécurité de ton compte avec une application d'authentification (Google
          Authenticator, Authy, 1Password, etc.)
        </p>

        <div
          class="flex items-center gap-3 p-4 rounded-lg bg-status-warn/10 border border-status-warn/30 mb-6"
        >
          <app-icon name="shield" [size]="20" class="text-status-warn shrink-0" />
          <div>
            <p class="text-status-warn font-medium text-sm">2FA non activé</p>
            <p class="text-muted text-xs">
              Ton compte n'est pas protégé par l'authentification à deux facteurs.
            </p>
          </div>
        </div>

        <div>
          <button
            data-testid="twofa-generate"
            appButton
            type="button"
            [block]="true"
            [disabled]="loading()"
            (click)="generate.emit()"
          >
            @if (loading()) {
              Génération...
            } @else {
              Configurer le 2FA
            }
          </button>
        </div>
      }
    </div>
  `,
})
export class TwoFactorEnableForm {
  readonly qrCodeUrl = input('');
  readonly secret = input('');
  readonly loading = input(false);
  readonly errorMessage = input('');
  readonly successMessage = input('');
  readonly resetToken = input<number>();
  // 2FA déjà active : l'application actuelle reste valable tant que la nouvelle n'est pas confirmée.
  readonly reconfiguring = input(false);
  readonly generate = output<void>();
  readonly verify = output<TwoFactorEnableRequest>();
  readonly cancelled = output<void>();

  private readonly _model = signal({ ...EMPTY });

  readonly tfaForm = form(
    this._model,
    (path) => {
      required(path.password, { message: 'Ce champ est obligatoire' });
      minLength(path.password, PASSWORD_MIN_LENGTH, {
        message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
      });
      required(path.code, { message: 'Ce champ est obligatoire' });
      pattern(path.code, TOTP_PATTERN, { message: 'Le code doit contenir 6 chiffres' });
    },
    {
      submission: {
        action: async () => {
          const { password, code } = this._model();
          this.verify.emit({ password, code });
        },
      },
    },
  );

  private readonly _resetEffect = effect(() => {
    this.resetToken();
    this.tfaForm().reset({ ...EMPTY });
  });
}
