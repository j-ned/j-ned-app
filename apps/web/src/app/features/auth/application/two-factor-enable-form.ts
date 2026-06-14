import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';

type TfaFormShape = {
  code: FormControl<string>;
};

@Component({
  selector: 'app-two-factor-enable-form',
  imports: [ReactiveFormsModule, AppIcon, Button],
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

          <form [formGroup]="tfaForm" (ngSubmit)="submitCode()" class="space-y-4">
            <div>
              <label for="totp-code" class="form-label">Code de vérification</label>
              <input
                id="totp-code"
                type="text"
                formControlName="code"
                maxlength="6"
                pattern="[0-9]*"
                autocomplete="one-time-code"
                inputmode="numeric"
                aria-required="true"
                [attr.aria-invalid]="
                  tfaForm.controls.code.touched && tfaForm.controls.code.invalid
                "
                [attr.aria-describedby]="
                  tfaForm.controls.code.touched && tfaForm.controls.code.invalid
                    ? 'twofa-setup-code-error'
                    : null
                "
                class="form-input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
              @if (tfaForm.controls.code.touched && tfaForm.controls.code.errors?.['required']) {
                <p id="twofa-setup-code-error" role="alert" class="form-error">
                  Ce champ est obligatoire
                </p>
              } @else if (
                tfaForm.controls.code.touched && tfaForm.controls.code.errors?.['pattern']
              ) {
                <p id="twofa-setup-code-error" role="alert" class="form-error">
                  Le code doit contenir 6 chiffres
                </p>
              }
            </div>

            <button
              type="submit"
              [disabled]="tfaForm.invalid || loading()"
              class="w-full py-2.5 px-4 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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

  readonly tfaForm = new FormGroup<TfaFormShape>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  constructor() {
    effect(() => {
      this.resetToken();
      this.tfaForm.reset();
    });
  }

  protected submitCode(): void {
    if (this.tfaForm.invalid) {
      this.tfaForm.markAllAsTouched();
      return;
    }

    this.verify.emit(this.tfaForm.getRawValue().code);
  }
}
