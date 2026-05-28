import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../infra';
import { AppIcon } from '@shared/icons';
import { Button, AppIconTile } from '@shared/ui';

type TwoFactorVerifyFormShape = {
  code: FormControl<string>;
};

@Component({
  selector: 'two-factor-verify',
  imports: [ReactiveFormsModule, RouterLink, AppIcon, Button, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="min-h-svh flex items-center justify-center bg-background px-4">
      <div
        class="w-full max-w-md bg-surface border border-foreground/10 rounded-2xl p-8"
      >
        <div class="flex justify-center mb-6">
          <app-icon-tile size="lg" class="bg-primary/10 border border-primary/20">
            <app-icon name="shield" [size]="28" class="text-primary" />
          </app-icon-tile>
        </div>

        <h1 class="text-2xl font-bold text-foreground mb-2 text-center">Vérification 2FA</h1>
        <p class="text-muted text-sm text-center mb-8">
          Entrez le code à 6 chiffres de votre application d'authentification
        </p>

        @if (errorMessage()) {
          <div
            class="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
          >
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="verifyCode()" class="space-y-5">
          <div>
            <label for="code" class="form-label">Code TOTP</label>
            <input
              id="code"
              type="text"
              formControlName="code"
              maxlength="6"
              pattern="[0-9]*"
              autocomplete="one-time-code"
              inputmode="numeric"
              aria-required="true"
              [attr.aria-invalid]="form.controls.code.touched && form.controls.code.invalid"
              [attr.aria-describedby]="
                form.controls.code.touched && form.controls.code.invalid ? 'twofa-code-error' : null
              "
              class="form-input text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
            />
            @if (form.controls.code.touched && form.controls.code.errors?.['required']) {
              <p id="twofa-code-error" role="alert" class="form-error">
                Le code est obligatoire
              </p>
            } @else if (form.controls.code.touched && form.controls.code.errors?.['pattern']) {
              <p id="twofa-code-error" role="alert" class="form-error">
                Le code doit contenir 6 chiffres
              </p>
            }
          </div>

          <app-button
            type="submit"
            severity="primary"
            [block]="true"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              Vérification...
            } @else {
              Vérifier
            }
          </app-button>
        </form>

        <nav class="mt-6 text-center">
          <a routerLink="/login" class="text-sm text-muted hover:text-primary transition-colors">
            Retour à la connexion
          </a>
        </nav>
      </div>
    </main>
  `,
})
export class TwoFactorVerify {
  private readonly authService = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  readonly form = new FormGroup<TwoFactorVerifyFormShape>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  protected verifyCode(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const challengeToken = this.authService.pendingChallengeToken();
    if (!challengeToken) {
      void this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .verifyTwoFactor(challengeToken, this.form.getRawValue().code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isSubmitting.set(false);
          if (success) {
            void this.router.navigate(['/admin']);
          } else {
            this.errorMessage.set('Code invalide');
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Erreur de vérification');
        },
      });
  }
}
