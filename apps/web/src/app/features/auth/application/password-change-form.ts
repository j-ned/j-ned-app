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
  type ValidationErrors,
} from '@angular/forms';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';

export type PasswordChangeRequest = {
  readonly currentPassword: string;
  readonly newPassword: string;
};

type PasswordFormShape = {
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
};

@Component({
  selector: 'app-password-change-form',
  imports: [ReactiveFormsModule, AppIcon, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-background/80 border border-foreground/10 rounded-2xl p-8">
      <div class="flex items-center gap-3 mb-2">
        <app-icon name="lock" [size]="20" class="text-primary" />
        <h2 class="text-xl font-bold text-foreground">Modifier le mot de passe</h2>
      </div>
      <p class="text-muted text-sm mb-6">
        Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un
        chiffre et un caractère spécial.
      </p>

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

      <form [formGroup]="pwdForm" (ngSubmit)="submitForm()" class="space-y-4">
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
              {{ pwdForm.controls.newPassword.errors['minlength'].requiredLength }} caractères
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
          [disabled]="pwdForm.invalid || loading()"
        >
          @if (loading()) {
            Modification...
          } @else {
            Modifier le mot de passe
          }
        </app-button>
      </form>
    </div>
  `,
})
export class PasswordChangeForm {
  readonly loading = input(false);
  readonly successMessage = input('');
  readonly errorMessage = input('');
  readonly resetToken = input<number>();
  readonly submitted = output<PasswordChangeRequest>();

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

  constructor() {
    effect(() => {
      this.resetToken();
      this.pwdForm.reset();
    });
  }

  protected submitForm(): void {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.pwdForm.getRawValue();
    this.submitted.emit({ currentPassword, newPassword });
  }
}
