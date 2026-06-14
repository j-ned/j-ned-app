import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';
import { ToastStore } from '@shared/ui/toast-store';
import { Button } from '@shared/ui/button';
import { AppIconTile } from '@shared/ui/icon-tile';
import { AppIcon } from '@shared/icons/app-icon';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AppIcon, Button, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="min-h-svh flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-sm">
        <!-- Header -->
        <div class="text-center mb-8">
          <app-icon-tile size="lg" class="bg-primary/10 border border-primary/20 mb-4">
            <app-icon name="shield" [size]="28" class="text-primary" />
          </app-icon-tile>
          <h1 class="text-xl font-bold text-foreground">Connexion Admin</h1>
          <p class="text-muted text-sm mt-1">Accédez au tableau de bord</p>
        </div>

        <!-- Card -->
        <div
          class="bg-surface border border-foreground/10 rounded-2xl p-6"
        >
          @if (errorMessage()) {
            <div
              class="mb-4 p-2.5 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center"
            >
              {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submitLogin()">
            <fieldset class="border-0 p-0 m-0">
              <legend class="sr-only">Identifiants de connexion</legend>

              <!-- Email -->
              <div>
                <label for="email" class="form-label">Email</label>
                <div class="relative">
                  <app-icon name="envelope" [size]="16" class="text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    aria-required="true"
                    [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
                    [attr.aria-describedby]="form.controls.email.touched && form.controls.email.invalid ? 'login-email-error' : null"
                    class="form-input pl-10"
                    placeholder="Votre email"
                  />
                </div>
                @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
                  <p id="login-email-error" role="alert" class="form-error">L'email est obligatoire</p>
                } @else if (form.controls.email.touched && form.controls.email.errors?.['email']) {
                  <p id="login-email-error" role="alert" class="form-error">L'email n'est pas valide</p>
                }
              </div>

              <!-- Password -->
              <div class="mt-3">
                <label for="password" class="form-label">Mot de passe</label>
                <div class="relative">
                  <app-icon name="lock" [size]="16" class="text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    formControlName="password"
                    autocomplete="current-password"
                    aria-required="true"
                    [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid"
                    [attr.aria-describedby]="form.controls.password.touched && form.controls.password.invalid ? 'login-password-error' : null"
                    class="form-input pl-10"
                    placeholder="Votre mot de passe"
                  />
                </div>
                @if (
                  form.controls.password.touched && form.controls.password.errors?.['required']
                ) {
                  <p id="login-password-error" role="alert" class="form-error">Le mot de passe est obligatoire</p>
                } @else if (
                  form.controls.password.touched && form.controls.password.errors?.['minlength']
                ) {
                  <p id="login-password-error" role="alert" class="form-error">
                    Le mot de passe doit contenir au moins 6 caractères
                  </p>
                }
              </div>
            </fieldset>

            <app-button
              type="submit"
              severity="primary"
              [block]="true"
              [disabled]="form.invalid || isSubmitting()"
              class="mt-5"
            >
              @if (isSubmitting()) {
                Connexion...
              } @else {
                Se connecter
              }
            </app-button>
          </form>
        </div>

        <!-- Footer -->
        <div class="mt-5 text-center">
          <a
            routerLink="/"
            class="text-xs text-muted hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <app-icon name="arrow-left" [size]="14" />
            Retour au site
          </a>
        </div>
      </div>
    </main>
  `,
})
export class Login {
  private readonly authService = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected submitLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();

    this.authService
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          if (result === 'success') {
            void this.router.navigate(['/admin']);
          } else if (result === 'two-factor') {
            void this.router.navigate(['/two-factor']);
          } else {
            this.errorMessage.set('Email ou mot de passe incorrect');
            this.toast.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Email ou mot de passe incorrect',
            });
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Erreur de connexion au serveur');
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur de connexion au serveur',
          });
        },
      });
  }
}
