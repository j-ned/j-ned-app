import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { StatusMessage } from '@shared/ui/status-message';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';

const EMPTY = { code: '' };
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
            <button
              type="submit"
              data-testid="twofa-submit"
              [disabled]="loading()"
              class="w-full min-h-11 py-2.5 px-4 rounded-lg bg-status-success hover:bg-status-success/90 text-on-status-success font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              @if (loading()) {
                Activation...
              } @else {
                Activer le 2FA
              }
            </button>
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
  readonly generate = output<void>();
  readonly verify = output<string>();

  private readonly _model = signal({ ...EMPTY });

  readonly tfaForm = form(
    this._model,
    (path) => {
      required(path.code, { message: 'Ce champ est obligatoire' });
      pattern(path.code, TOTP_PATTERN, { message: 'Le code doit contenir 6 chiffres' });
    },
    {
      submission: {
        action: async () => {
          this.verify.emit(this._model().code);
        },
      },
    },
  );

  private readonly _resetEffect = effect(() => {
    this.resetToken();
    this.tfaForm().reset({ ...EMPTY });
  });
}
