import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';

const EMPTY = { code: '' };
const TOTP_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-two-factor-enable-form',
  imports: [FormRoot, FormField, AppIcon, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-background/80 border border-foreground/10 rounded-2xl p-8">
      <div class="flex items-center gap-3 mb-2">
        <app-icon name="shield" [size]="20" class="text-primary" />
        <h2 class="text-xl font-bold text-foreground">Authentification à deux facteurs</h2>
      </div>

      @if (successMessage()) {
        <div
          class="mb-6 p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm text-center"
        >
          {{ successMessage() }}
        </div>
      }

      @if (errorMessage()) {
        <div
          class="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
        >
          {{ errorMessage() }}
        </div>
      }

      @if (qrCodeUrl()) {
        <p class="text-muted text-sm mb-6">
          Renforcez la sécurité de votre compte avec une application d'authentification (Google
          Authenticator, Authy, 1Password, etc.)
        </p>

        <div class="space-y-6">
          <div class="text-center">
            <p class="text-sm text-muted mb-4">
              Scannez ce QR code avec votre application d'authentification :
            </p>
            <div class="inline-block p-4 bg-white rounded-xl">
              <img
                [src]="qrCodeUrl()"
                alt="QR code à scanner avec votre application d'authentification"
                width="192"
                height="192"
                class="w-48 h-48"
              />
            </div>
          </div>

          @if (secret()) {
            <div>
              <p class="text-sm text-muted mb-1">Ou entrez ce code manuellement :</p>
              <code
                class="block w-full p-3 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground text-center font-mono text-sm tracking-wider select-all"
              >
                {{ secret() }}
              </code>
            </div>
          }

          <form [formRoot]="tfaForm" class="space-y-4">
            <div>
              @let code = tfaForm.code();
              <label for="totp-code" class="form-label">Code de vérification</label>
              <input
                id="totp-code"
                type="text"
                [formField]="tfaForm.code"
                autocomplete="one-time-code"
                inputmode="numeric"
                aria-required="true"
                [attr.aria-invalid]="code.touched() && code.invalid()"
                [attr.aria-describedby]="
                  code.touched() && code.invalid() ? 'twofa-setup-code-error' : null
                "
                class="form-input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
              @if (code.touched() && code.invalid()) {
                <p id="twofa-setup-code-error" role="alert" class="form-error">
                  {{ code.errors()[0].message }}
                </p>
              }
            </div>
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full min-h-11 py-2.5 px-4 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
          Renforcez la sécurité de votre compte avec une application d'authentification (Google
          Authenticator, Authy, 1Password, etc.)
        </p>

        <div
          class="flex items-center gap-3 p-4 rounded-lg bg-status-warn/10 border border-status-warn/30 mb-6"
        >
          <app-icon name="shield" [size]="20" class="text-status-warn shrink-0" />
          <div>
            <p class="text-status-warn font-medium text-sm">2FA non activé</p>
            <p class="text-muted text-xs">
              Votre compte n'est pas protégé par l'authentification à deux facteurs.
            </p>
          </div>
        </div>

        <div data-testid="twofa-generate">
          <app-button
            severity="primary"
            [block]="true"
            [disabled]="loading()"
            (click)="generate.emit()"
          >
            @if (loading()) {
              Génération...
            } @else {
              Configurer le 2FA
            }
          </app-button>
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

  constructor() {
    effect(() => {
      this.resetToken();
      this.tfaForm().reset({ ...EMPTY });
    });
  }
}
