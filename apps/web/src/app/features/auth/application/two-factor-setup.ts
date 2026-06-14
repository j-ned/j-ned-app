import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStore } from '@core/auth/auth-store';
import { PasswordChangeForm, type PasswordChangeRequest } from './password-change-form';
import { TwoFactorEnableForm } from './two-factor-enable-form';
import { TwoFactorDisableForm } from './two-factor-disable-form';

@Component({
  selector: 'app-two-factor-setup',
  imports: [PasswordChangeForm, TwoFactorEnableForm, TwoFactorDisableForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="max-w-lg mx-auto space-y-8">
      <app-password-change-form
        [loading]="isPwdLoading()"
        [successMessage]="pwdSuccess()"
        [errorMessage]="pwdError()"
        [resetToken]="pwdResetToken()"
        (submitted)="changePassword($event)"
      />

      @if (isTwoFactorEnabled()) {
        <app-two-factor-disable-form
          [loading]="isTfaLoading()"
          [successMessage]="tfaSuccess()"
          [errorMessage]="tfaError()"
          [showForm]="showDisableForm()"
          [resetToken]="tfaResetToken()"
          (disable)="disableTwoFactor($event)"
          (cancelled)="showDisableForm.set(false)"
          (requestDisable)="showDisableForm.set(true)"
          (reconfigure)="reconfigure()"
        />
      } @else {
        <app-two-factor-enable-form
          [qrCodeUrl]="qrCodeUrl()"
          [secret]="secret()"
          [loading]="isTfaLoading()"
          [successMessage]="tfaSuccess()"
          [errorMessage]="tfaError()"
          [resetToken]="tfaResetToken()"
          (generate)="generate()"
          (verify)="enable($event)"
        />
      }
    </div>
  `,
})
export class TwoFactorSetup {
  private readonly authService = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly isTwoFactorEnabled = computed(
    () => this.authService.currentUser()?.isTwoFactorEnabled ?? false,
  );

  readonly pwdSuccess = signal('');
  readonly pwdError = signal('');
  readonly isPwdLoading = signal(false);
  readonly pwdResetToken = signal(0);

  readonly qrCodeUrl = signal('');
  readonly secret = signal('');
  readonly tfaError = signal('');
  readonly tfaSuccess = signal('');
  readonly isTfaLoading = signal(false);
  readonly showDisableForm = signal(false);
  readonly tfaResetToken = signal(0);

  changePassword(request: PasswordChangeRequest): void {
    this.isPwdLoading.set(true);
    this.pwdError.set('');
    this.pwdSuccess.set('');

    this.authService
      .changePassword(request.currentPassword, request.newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isPwdLoading.set(false);
          if (success) {
            this.pwdSuccess.set('Mot de passe modifié avec succès !');
            this.pwdResetToken.update((token) => token + 1);
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

  enable(code: string): void {
    this.isTfaLoading.set(true);
    this.tfaError.set('');
    this.tfaSuccess.set('');

    this.authService
      .enableTwoFactor(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isTfaLoading.set(false);
          if (success) {
            this.tfaSuccess.set('Authentification à deux facteurs activée avec succès !');
            this.qrCodeUrl.set('');
            this.secret.set('');
            this.tfaResetToken.update((token) => token + 1);
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

  disableTwoFactor(password: string): void {
    this.isTfaLoading.set(true);
    this.tfaError.set('');
    this.tfaSuccess.set('');

    this.authService
      .disableTwoFactor(password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isTfaLoading.set(false);
          if (success) {
            this.tfaSuccess.set('Authentification à deux facteurs désactivée.');
            this.showDisableForm.set(false);
            this.tfaResetToken.update((token) => token + 1);
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
