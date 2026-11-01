import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import { FieldError } from '@shared/ui/field-error';

const EMPTY = { password: '' };

@Component({
  selector: 'app-two-factor-disable-form',
  imports: [FormRoot, FormField, AppIcon, Button, Stamp, FieldError],
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

      <div class="space-y-6">
        <div class="grid justify-items-start gap-2">
          <app-stamp data-testid="twofa-status">2FA activé</app-stamp>
          <p class="text-muted text-sm">
            Votre compte est protégé par l'authentification à deux facteurs.
          </p>
        </div>

        <div class="border-t border-foreground/10 pt-6">
          <p class="text-muted text-sm mb-4">
            Pour désactiver le 2FA ou le reconfigurer avec une nouvelle application, entrez votre
            mot de passe.
          </p>

          @if (!showForm()) {
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                appButton
                type="button"
                variant="outlined-danger"
                [block]="true"
                class="sm:flex-1"
                data-testid="twofa-disable-show"
                (click)="requestDisable.emit()"
              >
                Désactiver le 2FA
              </button>
              <button
                appButton
                type="button"
                [block]="true"
                class="sm:flex-1"
                [disabled]="loading()"
                data-testid="twofa-reconfigure"
                (click)="reconfigure.emit()"
              >
                Reconfigurer
              </button>
            </div>
          } @else {
            <form [formRoot]="disableForm" class="space-y-4">
              <div>
                @let passwordInError =
                  disableForm.password().touched() && disableForm.password().invalid();
                <label for="disable-pw" class="form-label">Mot de passe</label>
                <input
                  id="disable-pw"
                  type="password"
                  [formField]="disableForm.password"
                  autocomplete="current-password"
                  aria-required="true"
                  [attr.aria-invalid]="passwordInError"
                  [attr.aria-describedby]="passwordInError ? 'twofa-setup-disable-pw-error' : null"
                  class="form-input"
                  placeholder="Votre mot de passe"
                />
                <app-field-error
                  [field]="disableForm.password"
                  errorId="twofa-setup-disable-pw-error"
                />
              </div>
              <div class="flex flex-col gap-3 sm:flex-row">
                <button
                  appButton
                  type="button"
                  variant="outlined"
                  [block]="true"
                  class="sm:flex-1"
                  data-testid="twofa-disable-cancel"
                  (click)="cancelled.emit()"
                >
                  Annuler
                </button>
                <button
                  appButton
                  type="submit"
                  variant="danger"
                  [block]="true"
                  class="sm:flex-1"
                  [disabled]="loading()"
                >
                  @if (loading()) {
                    Désactivation...
                  } @else {
                    Confirmer
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
})
export class TwoFactorDisableForm {
  readonly loading = input(false);
  readonly errorMessage = input('');
  readonly successMessage = input('');
  readonly showForm = input(false);
  readonly resetToken = input<number>();
  readonly disable = output<string>();
  readonly cancelled = output<void>();
  readonly reconfigure = output<void>();
  readonly requestDisable = output<void>();

  private readonly _model = signal({ ...EMPTY });

  readonly disableForm = form(
    this._model,
    (path) => {
      required(path.password, { message: 'Ce champ est obligatoire' });
    },
    {
      submission: {
        action: async () => {
          this.disable.emit(this._model().password);
        },
      },
    },
  );

  constructor() {
    // Le parent incrémente `resetToken` après une désactivation : le formulaire repart à vide.
    effect(() => {
      this.resetToken();
      this.disableForm().reset({ ...EMPTY });
    });
  }
}
