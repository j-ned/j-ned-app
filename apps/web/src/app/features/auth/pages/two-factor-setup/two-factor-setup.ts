import {
  ChangeDetectionStrategy,
  Component,
  PendingTasks,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '@core/auth/auth-store';
import {
  PasswordChangeForm,
  type PasswordChangeRequest,
} from '../../application/password-change-form';
import {
  TwoFactorEnableForm,
  type TwoFactorEnableRequest,
} from '../../application/two-factor-enable-form';
import { TwoFactorDisableForm } from '../../application/two-factor-disable-form';
import { TwoFactorBackupCodes } from '../../application/two-factor-backup-codes';

@Component({
  selector: 'app-two-factor-setup',
  imports: [PasswordChangeForm, TwoFactorEnableForm, TwoFactorDisableForm, TwoFactorBackupCodes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="max-w-lg mx-auto space-y-8">
      <h1 class="text-[2.5rem] leading-none font-extrabold tracking-[-0.04em]">Sécurité</h1>
      <app-password-change-form
        [loading]="isPwdLoading()"
        [successMessage]="pwdSuccess()"
        [errorMessage]="pwdError()"
        [resetToken]="pwdResetToken()"
        (submitted)="changePassword($event)"
      />

      @if (backupCodes().length > 0) {
        <app-two-factor-backup-codes [codes]="backupCodes()" (acknowledged)="backupCodes.set([])" />
      }

      @if (isTwoFactorEnabled() && !reconfiguring()) {
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
          [reconfiguring]="reconfiguring()"
          (generate)="generate()"
          (verify)="enable($event)"
          (cancelled)="cancelReconfigure()"
        />
      }
    </div>
  `,
})
export class TwoFactorSetup {
  private readonly authService = inject(AuthStore);
  private readonly pendingTasks = inject(PendingTasks);

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
  readonly reconfiguring = signal(false);
  readonly backupCodes = signal<readonly string[]>([]);

  async changePassword(request: PasswordChangeRequest): Promise<void> {
    if (this.isPwdLoading()) return;
    this.isPwdLoading.set(true);
    const done = this.pendingTasks.add();
    this.pwdError.set('');
    this.pwdSuccess.set('');
    try {
      const changed = await firstValueFrom(
        this.authService.changePassword(request.currentPassword, request.newPassword),
      );
      if (changed) {
        this.pwdSuccess.set('Mot de passe modifié avec succès !');
        this.pwdResetToken.update((token) => token + 1);
      } else {
        this.pwdError.set('Mot de passe actuel incorrect');
      }
    } catch {
      this.pwdError.set('Erreur lors de la modification');
    } finally {
      this.isPwdLoading.set(false);
      done();
    }
  }

  async generate(): Promise<void> {
    if (this.isTfaLoading()) return;
    this.isTfaLoading.set(true);
    this.tfaError.set('');
    const done = this.pendingTasks.add();
    try {
      const { qrCodeDataUrl, secret } = await firstValueFrom(
        this.authService.generateTwoFactorSecret(),
      );
      this.qrCodeUrl.set(qrCodeDataUrl);
      this.secret.set(secret);
    } catch {
      this.tfaError.set('Erreur lors de la génération du QR code');
    } finally {
      this.isTfaLoading.set(false);
      done();
    }
  }

  async enable(request: TwoFactorEnableRequest): Promise<void> {
    if (this.isTfaLoading()) return;
    const done = this.startTfaCommand();
    try {
      const outcome = await firstValueFrom(
        this.authService.enableTwoFactor(request.password, request.code),
      );
      if (outcome.kind === 'enabled') {
        this.backupCodes.set(outcome.backupCodes);
        this.tfaSuccess.set(
          this.reconfiguring()
            ? 'Authentification à deux facteurs reconfigurée.'
            : 'Authentification à deux facteurs activée avec succès !',
        );
        this.reconfiguring.set(false);
        this.qrCodeUrl.set('');
        this.secret.set('');
        this.tfaResetToken.update((token) => token + 1);
      } else {
        this.tfaError.set('Mot de passe ou code invalide. Réessaie.');
      }
    } catch {
      this.tfaError.set("Erreur lors de l'activation");
    } finally {
      this.isTfaLoading.set(false);
      done();
    }
  }

  async disableTwoFactor(password: string): Promise<void> {
    if (this.isTfaLoading()) return;
    const done = this.startTfaCommand();
    try {
      if (await firstValueFrom(this.authService.disableTwoFactor(password))) {
        this.tfaSuccess.set('Authentification à deux facteurs désactivée.');
        this.showDisableForm.set(false);
        this.tfaResetToken.update((token) => token + 1);
      } else {
        this.tfaError.set('Mot de passe incorrect.');
      }
    } catch {
      this.tfaError.set('Erreur lors de la désactivation.');
    } finally {
      this.isTfaLoading.set(false);
      done();
    }
  }

  async reconfigure(): Promise<void> {
    this.tfaError.set('');
    this.tfaSuccess.set('');
    await this.generate();
    if (this.qrCodeUrl()) this.reconfiguring.set(true);
  }

  cancelReconfigure(): void {
    this.reconfiguring.set(false);
    this.qrCodeUrl.set('');
    this.secret.set('');
    this.tfaError.set('');
    this.tfaResetToken.update((token) => token + 1);
  }

  private startTfaCommand(): () => void {
    this.isTfaLoading.set(true);
    this.tfaError.set('');
    this.tfaSuccess.set('');
    return this.pendingTasks.add();
  }
}
