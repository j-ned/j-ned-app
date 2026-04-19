import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../infrastructure';

type TwoFactorVerifyFormShape = {
  code: FormControl<string>;
};

@Component({
  selector: 'app-two-factor-verify',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="min-h-screen flex items-center justify-center bg-background px-4">
      <div
        class="w-full max-w-md bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-8 shadow-2xl"
      >
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center"
          >
            <i class="pi pi-shield text-[2rem] text-primary" aria-hidden="true"></i>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-foreground mb-2 text-center">Vérification 2FA</h1>
        <p class="text-muted text-sm text-center mb-8">
          Entrez le code à 6 chiffres de votre application d'authentification
        </p>

        @if (errorMessage()) {
          <div
            class="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
          >
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="code" class="block text-sm font-medium text-foreground mb-1.5"
              >Code TOTP</label
            >
            <input
              id="code"
              type="text"
              formControlName="code"
              maxlength="6"
              autocomplete="one-time-code"
              inputmode="numeric"
              class="w-full px-4 py-3 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder-muted focus:border-primary focus:outline-none transition-colors"
              placeholder="000000"
            />
            @if (form.controls.code.touched && form.controls.code.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">Le code est obligatoire</span>
            } @else if (form.controls.code.touched && form.controls.code.errors?.['pattern']) {
              <span class="text-red-400 text-xs mt-1 block">Le code doit contenir 6 chiffres</span>
            }
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting()"
            class="w-full py-2.5 px-4 rounded-lg bg-linear-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-700 hover:to-violet-700 hover:-translate-y-0.5 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
          >
            @if (isSubmitting()) {
              Vérification...
            } @else {
              Vérifier
            }
          </button>
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
  private readonly authService = inject(AuthService);
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.authService.pendingTwoFactorEmail();
    if (!email) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .verifyTwoFactor(email, this.form.getRawValue().code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (success) => {
          this.isSubmitting.set(false);
          if (success) {
            this.router.navigate(['/admin']);
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
