import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';

export type PasswordChangeRequest = {
  readonly currentPassword: string;
  readonly newPassword: string;
};

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_COMPLEXITY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/;

@Component({
  selector: 'app-password-change-form',
  imports: [FormRoot, FormField, AppIcon, Button, FieldError],
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

      <form [formRoot]="pwdForm" class="space-y-4">
        <div>
          @let currentPasswordInError =
            pwdForm.currentPassword().touched() && pwdForm.currentPassword().invalid();
          <label for="current-pw" class="form-label">Mot de passe actuel</label>
          <input
            id="current-pw"
            type="password"
            [formField]="pwdForm.currentPassword"
            autocomplete="current-password"
            aria-required="true"
            [attr.aria-invalid]="currentPasswordInError"
            [attr.aria-describedby]="currentPasswordInError ? 'twofa-setup-current-pw-error' : null"
            class="form-input"
            placeholder="Mot de passe actuel"
          />
          <app-field-error
            [field]="pwdForm.currentPassword"
            errorId="twofa-setup-current-pw-error"
          />
        </div>

        <div>
          @let newPasswordInError =
            pwdForm.newPassword().touched() && pwdForm.newPassword().invalid();
          <label for="new-pw" class="form-label">Nouveau mot de passe</label>
          <input
            id="new-pw"
            type="password"
            [formField]="pwdForm.newPassword"
            autocomplete="new-password"
            aria-required="true"
            [attr.aria-invalid]="newPasswordInError"
            [attr.aria-describedby]="newPasswordInError ? 'twofa-setup-new-pw-error' : null"
            class="form-input"
            placeholder="Nouveau mot de passe"
          />
          <app-field-error [field]="pwdForm.newPassword" errorId="twofa-setup-new-pw-error" />
        </div>

        <div>
          @let confirmPasswordInError =
            pwdForm.confirmPassword().touched() && pwdForm.confirmPassword().invalid();
          <label for="confirm-pw" class="form-label">Confirmer le mot de passe</label>
          <input
            id="confirm-pw"
            type="password"
            [formField]="pwdForm.confirmPassword"
            autocomplete="new-password"
            aria-required="true"
            [attr.aria-invalid]="confirmPasswordInError"
            [attr.aria-describedby]="confirmPasswordInError ? 'twofa-setup-confirm-pw-error' : null"
            class="form-input"
            placeholder="Confirmer le mot de passe"
          />
          <app-field-error
            [field]="pwdForm.confirmPassword"
            errorId="twofa-setup-confirm-pw-error"
          />
        </div>

        <app-button type="submit" severity="primary" [block]="true" [disabled]="loading()">
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

  private readonly _model = signal({ ...EMPTY });

  readonly pwdForm = form(
    this._model,
    (path) => {
      required(path.currentPassword, { message: 'Champ obligatoire' });
      required(path.newPassword, { message: 'Champ obligatoire' });
      minLength(path.newPassword, PASSWORD_MIN_LENGTH, {
        message: `Minimum ${PASSWORD_MIN_LENGTH} caractères requis`,
      });
      pattern(path.newPassword, PASSWORD_COMPLEXITY, {
        message: 'Majuscule, minuscule, chiffre et caractère spécial requis',
      });
      required(path.confirmPassword, { message: 'Champ obligatoire' });
      // Validation croisée : l'erreur vit sur la confirmation, le champ que l'utilisateur corrige.
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() === valueOf(path.newPassword)
          ? null
          : { kind: 'mismatch', message: 'Les mots de passe ne correspondent pas' },
      );
    },
    {
      submission: {
        action: async () => {
          const { currentPassword, newPassword } = this._model();
          this.submitted.emit({ currentPassword, newPassword });
        },
      },
    },
  );

  constructor() {
    effect(() => {
      this.resetToken();
      this.pwdForm().reset({ ...EMPTY });
    });
  }
}
