import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
  type ValidationErrors,
} from '@angular/forms';
import { AuthStore } from '../infra';
import { AppIcon } from '@shared/icons';
import { Button } from '@shared/ui';

type PasswordFormShape = {
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
};

type TfaFormShape = {
  code: FormControl<string>;
};

type DisableFormShape = {
  password: FormControl<string>;
};

@Component({
  selector: 'app-two-factor-setup',
  imports: [ReactiveFormsModule, AppIcon, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="max-w-lg mx-auto space-y-8">
      <!-- Change Password -->
      <div class="bg-background/80 border border-foreground/10 rounded-2xl p-8">
        <div class="flex items-center gap-3 mb-2">
          <app-icon name="lock" [size]="20" class="text-primary" />
          <h2 class="text-xl font-bold text-foreground">Modifier le mot de passe</h2>
        </div>
        <p class="text-muted text-sm mb-6">
          Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un
          chiffre et un caractère spécial.
        </p>

        @if (pwdSuccess()) {
          <div
            class="mb-6 p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm text-center"
          >
            {{ pwdSuccess() }}
          </div>
        }

        @if (pwdError()) {
          <div
            class="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
          >
            {{ pwdError() }}
          </div>
        }

        <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="space-y-4">
          <div>
            <label for="current-pw" class="form-label">Mot de passe actuel</label>
            <input
              id="current-pw"
              type="password"
              formControlName="currentPassword"
              autocomplete="current-password"
              aria-required="true"
              [attr.aria-invalid]="
                pwdForm.controls.currentPassword.touched && pwdForm.controls.currentPassword.invalid
              "
              [attr.aria-describedby]="
                pwdForm.controls.currentPassword.touched && pwdForm.controls.currentPassword.invalid
                  ? 'twofa-setup-current-pw-error'
                  : null
              "
              class="form-input"
              placeholder="Mot de passe actuel"
            />
            @if (
              pwdForm.controls.currentPassword.touched &&
              pwdForm.controls.currentPassword.errors?.['required']
            ) {
              <p id="twofa-setup-current-pw-error" role="alert" class="form-error">
                Champ obligatoire
              </p>
            }
          </div>

          <div>
            <label for="new-pw" class="form-label">Nouveau mot de passe</label>
            <input
              id="new-pw"
              type="password"
              formControlName="newPassword"
              autocomplete="new-password"
              aria-required="true"
              [attr.aria-invalid]="
                pwdForm.controls.newPassword.touched && pwdForm.controls.newPassword.invalid
              "
              [attr.aria-describedby]="
                pwdForm.controls.newPassword.touched && pwdForm.controls.newPassword.invalid
                  ? 'twofa-setup-new-pw-error'
                  : null
              "
              class="form-input"
              placeholder="Nouveau mot de passe"
            />
            @if (
              pwdForm.controls.newPassword.touched &&
              pwdForm.controls.newPassword.errors?.['required']
            ) {
              <p id="twofa-setup-new-pw-error" role="alert" class="form-error">
                Champ obligatoire
              </p>
            } @else if (
              pwdForm.controls.newPassword.touched &&
              pwdForm.controls.newPassword.errors?.['minlength']
            ) {
              <p id="twofa-setup-new-pw-error" role="alert" class="form-error">
                Minimum
                {{ pwdForm.controls.newPassword.errors?.['minlength'].requiredLength }} caractères
                requis
              </p>
            } @else if (
              pwdForm.controls.newPassword.touched &&
              pwdForm.controls.newPassword.errors?.['pattern']
            ) {
              <p id="twofa-setup-new-pw-error" role="alert" class="form-error">
                Majuscule, minuscule, chiffre et caractère spécial requis
              </p>
            }
          </div>

          <div>
            <label for="confirm-pw" class="form-label">Confirmer le mot de passe</label>
            <input
              id="confirm-pw"
              type="password"
              formControlName="confirmPassword"
              autocomplete="new-password"
              aria-required="true"
              [attr.aria-invalid]="
                pwdForm.controls.confirmPassword.touched &&
                (pwdForm.controls.confirmPassword.invalid || pwdForm.hasError('mismatch'))
              "
              [attr.aria-describedby]="
                pwdForm.controls.confirmPassword.touched &&
                (pwdForm.controls.confirmPassword.invalid || pwdForm.hasError('mismatch'))
                  ? 'twofa-setup-confirm-pw-error'
                  : null
              "
              class="form-input"
              placeholder="Confirmer le mot de passe"
            />
            @if (
              pwdForm.controls.confirmPassword.touched &&
              pwdForm.controls.confirmPassword.errors?.['required']
            ) {
              <p id="twofa-setup-confirm-pw-error" role="alert" class="form-error">
                Champ obligatoire
              </p>
            }
            @if (pwdForm.controls.confirmPassword.touched && pwdForm.hasError('mismatch')) {
              <p id="twofa-setup-confirm-pw-error" role="alert" class="form-error">
                Les mots de passe ne correspondent pas
              </p>
            }
          </div>

          <app-button
            type="submit"
            severity="primary"
            [block]="true"
            [disabled]="pwdForm.invalid || isPwdLoading()"
          >
            @if (isPwdLoading()) {
              Modification...
            } @else {
              Modifier le mot de passe
            }
          </app-button>
        </form>
      </div>

      <!-- 2FA Setup -->
      <div class="bg-background/80 border border-foreground/10 rounded-2xl p-8">
        <div class="flex items-center gap-3 mb-2">
          <app-icon name="shield" [size]="20" class="text-primary" />
          <h2 class="text-xl font-bold text-foreground">Authentification à deux facteurs</h2>
        </div>

        @if (tfaSuccess()) {
          <div
            class="mb-6 p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm text-center"
          >
            {{ tfaSuccess() }}
          </div>
        }

        @if (tfaError()) {
          <div
            class="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
          >
            {{ tfaError() }}
          </div>
        }

        @if (isTwoFactorEnabled()) {
          <!-- 2FA is enabled — show status and disable option -->
          <div class="space-y-6">
            <div
              class="flex items-center gap-3 p-4 rounded-lg bg-status-success/10 border border-status-success/30"
            >
              <app-icon name="shield" [size]="20" class="text-status-success shrink-0" />
              <div>
                <p class="text-status-success font-medium text-sm">2FA activé</p>
                <p class="text-muted text-xs">
                  Votre compte est protégé par l'authentification à deux facteurs.
                </p>
              </div>
            </div>

            <div class="border-t border-foreground/10 pt-6">
              <p class="text-muted text-sm mb-4">
                Pour désactiver le 2FA ou le reconfigurer avec une nouvelle application, entrez
                votre mot de passe.
              </p>

              @if (!showDisableForm()) {
                <div class="flex gap-3">
                  <app-button
                    severity="danger"
                    variant="outlined"
                    class="flex-1"
                    (click)="showDisableForm.set(true)"
                  >
                    Désactiver le 2FA
                  </app-button>
                  <app-button
                    severity="primary"
                    class="flex-1"
                    [disabled]="isTfaLoading()"
                    (click)="reconfigure()"
                  >
                    Reconfigurer
                  </app-button>
                </div>
              } @else {
                <form [formGroup]="disableForm" (ngSubmit)="disableTwoFactor()" class="space-y-4">
                  <div>
                    <label for="disable-pw" class="form-label">Mot de passe</label>
                    <input
                      id="disable-pw"
                      type="password"
                      formControlName="password"
                      autocomplete="current-password"
                      aria-required="true"
                      [attr.aria-invalid]="
                        disableForm.controls.password.touched &&
                        disableForm.controls.password.invalid
                      "
                      [attr.aria-describedby]="
                        disableForm.controls.password.touched &&
                        disableForm.controls.password.invalid
                          ? 'twofa-setup-disable-pw-error'
                          : null
                      "
                      class="form-input"
                      placeholder="Votre mot de passe"
                    />
                    @if (
                      disableForm.controls.password.touched &&
                      disableForm.controls.password.errors?.['required']
                    ) {
                      <p id="twofa-setup-disable-pw-error" role="alert" class="form-error">
                        Ce champ est obligatoire
                      </p>
                    }
                  </div>
                  <div class="flex gap-3">
                    <app-button
                      severity="secondary"
                      variant="outlined"
                      class="flex-1"
                      (click)="showDisableForm.set(false)"
                    >
                      Annuler
                    </app-button>
                    <app-button
                      type="submit"
                      severity="danger"
                      class="flex-1"
                      [disabled]="disableForm.invalid || isTfaLoading()"
                    >
                      @if (isTfaLoading()) {
                        Désactivation...
                      } @else {
                        Confirmer
                      }
                    </app-button>
                  </div>
                </form>
              }
            </div>
          </div>
        } @else if (qrCodeUrl()) {
          <!-- QR code generated — show setup form -->
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

            <form [formGroup]="tfaForm" (ngSubmit)="enable()" class="space-y-4">
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
                [disabled]="tfaForm.invalid || isTfaLoading()"
                class="w-full py-2.5 px-4 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                @if (isTfaLoading()) {
                  Activation...
                } @else {
                  Activer le 2FA
                }
              </button>
            </form>
          </div>
        } @else {
          <!-- 2FA not enabled — show setup button -->
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

          <app-button
            severity="primary"
            [block]="true"
            [disabled]="isTfaLoading()"
            (click)="generate()"
          >
            @if (isTfaLoading()) {
              Génération...
            } @else {
              Configurer le 2FA
            }
          </app-button>
        }
      </div>
    </div>
  `,
})
export class TwoFactorSetup {
  private readonly authService = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly isTwoFactorEnabled = computed(
    () => this.authService.currentUser()?.isTwoFactorEnabled ?? false,
  );

  // Password change
  readonly pwdSuccess = signal('');
  readonly pwdError = signal('');
  readonly isPwdLoading = signal(false);

  readonly pwdForm = new FormGroup<PasswordFormShape>(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: (group): ValidationErrors | null => {
        const newPw = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return newPw === confirm ? null : { mismatch: true };
      },
    },
  );

  changePassword(): void {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }

    this.isPwdLoading.set(true);
    this.pwdError.set('');
    this.pwdSuccess.set('');

    const { currentPassword, newPassword } = this.pwdForm.getRawValue();

    this.authService
      .changePassword(currentPassword, newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isPwdLoading.set(false);
          if (success) {
            this.pwdSuccess.set('Mot de passe modifié avec succès !');
            this.pwdForm.reset();
          } else {
            this.pwdError.set('Mot de passe actuel incorrect');
          }
        },
        error: () => {
          this.isPwdLoading.set(false);
          this.pwdError.set('Erreur lors de la modification');
        },
      });
  }

  // 2FA setup
  readonly qrCodeUrl = signal('');
  readonly secret = signal('');
  readonly tfaError = signal('');
  readonly tfaSuccess = signal('');
  readonly isTfaLoading = signal(false);
  readonly showDisableForm = signal(false);

  readonly tfaForm = new FormGroup<TfaFormShape>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  readonly disableForm = new FormGroup<DisableFormShape>({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  generate(): void {
    this.isTfaLoading.set(true);
    this.tfaError.set('');

    this.authService
      .generateTwoFactorSecret()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.qrCodeUrl.set(res.qrCodeDataUrl);
          this.secret.set(res.secret);
          this.isTfaLoading.set(false);
        },
        error: () => {
          this.tfaError.set('Erreur lors de la génération du QR code');
          this.isTfaLoading.set(false);
        },
      });
  }

  enable(): void {
    if (this.tfaForm.invalid) {
      this.tfaForm.markAllAsTouched();
      return;
    }

    this.isTfaLoading.set(true);
    this.tfaError.set('');
    this.tfaSuccess.set('');

    this.authService
      .enableTwoFactor(this.tfaForm.getRawValue().code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isTfaLoading.set(false);
          if (success) {
            this.tfaSuccess.set('Authentification à deux facteurs activée avec succès !');
            this.qrCodeUrl.set('');
            this.secret.set('');
            this.tfaForm.reset();
          } else {
            this.tfaError.set('Code invalide. Réessayez.');
          }
        },
        error: () => {
          this.isTfaLoading.set(false);
          this.tfaError.set("Erreur lors de l'activation");
        },
      });
  }

  disableTwoFactor(): void {
    if (this.disableForm.invalid) {
      this.disableForm.markAllAsTouched();
      return;
    }

    this.isTfaLoading.set(true);
    this.tfaError.set('');
    this.tfaSuccess.set('');

    this.authService
      .disableTwoFactor(this.disableForm.getRawValue().password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isTfaLoading.set(false);
          if (success) {
            this.tfaSuccess.set('Authentification à deux facteurs désactivée.');
            this.showDisableForm.set(false);
            this.disableForm.reset();
          } else {
            this.tfaError.set('Mot de passe incorrect.');
          }
        },
        error: () => {
          this.isTfaLoading.set(false);
          this.tfaError.set('Erreur lors de la désactivation.');
        },
      });
  }

  reconfigure(): void {
    this.tfaError.set('');
    this.tfaSuccess.set('');
    this.generate();
  }
}
