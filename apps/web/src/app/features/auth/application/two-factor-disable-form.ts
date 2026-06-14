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

type DisableFormShape = {
  password: FormControl<string>;
};

@Component({
  selector: 'app-two-factor-disable-form',
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
            Pour désactiver le 2FA ou le reconfigurer avec une nouvelle application, entrez votre
            mot de passe.
          </p>

          @if (!showForm()) {
            <div class="flex gap-3">
              <app-button
                severity="danger"
                variant="outlined"
                class="flex-1"
                data-testid="twofa-disable-show"
                (click)="requestDisable.emit()"
              >
                Désactiver le 2FA
              </app-button>
              <app-button
                severity="primary"
                class="flex-1"
                [disabled]="loading()"
                data-testid="twofa-reconfigure"
                (click)="reconfigure.emit()"
              >
                Reconfigurer
              </app-button>
            </div>
          } @else {
            <form [formGroup]="disableForm" (ngSubmit)="submitDisable()" class="space-y-4">
              <div>
                <label for="disable-pw" class="form-label">Mot de passe</label>
                <input
                  id="disable-pw"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  aria-required="true"
                  [attr.aria-invalid]="
                    disableForm.controls.password.touched && disableForm.controls.password.invalid
                  "
                  [attr.aria-describedby]="
                    disableForm.controls.password.touched && disableForm.controls.password.invalid
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
                  data-testid="twofa-disable-cancel"
                  (click)="cancelled.emit()"
                >
                  Annuler
                </app-button>
                <app-button
                  type="submit"
                  severity="danger"
                  class="flex-1"
                  [disabled]="disableForm.invalid || loading()"
                >
                  @if (loading()) {
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

  readonly disableForm = new FormGroup<DisableFormShape>({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    effect(() => {
      this.resetToken();
      this.disableForm.reset();
    });
  }

  protected submitDisable(): void {
    if (this.disableForm.invalid) {
      this.disableForm.markAllAsTouched();
      return;
    }

    this.disable.emit(this.disableForm.getRawValue().password);
  }
}
