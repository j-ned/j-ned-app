import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../infrastructure';
import { ToastService } from '@shared/ui';

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-sm">
        <!-- Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 shadow-lg shadow-violet-500/20 mb-4"
          >
            <i class="pi pi-shield text-[1.75rem] text-white" aria-hidden="true"></i>
          </div>
          <h1 class="text-xl font-bold text-foreground">Connexion Admin</h1>
          <p class="text-muted text-sm mt-1">Accédez au tableau de bord</p>
        </div>

        <!-- Card -->
        <div
          class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 shadow-2xl"
        >
          @if (errorMessage()) {
            <div
              class="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
            >
              {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <fieldset class="border-0 p-0 m-0">
              <legend class="sr-only">Identifiants de connexion</legend>

              <!-- Email -->
              <div>
                <label for="email" class="block text-xs font-medium text-muted mb-1">Email</label>
                <div class="relative">
                  <i
                    class="pi pi-envelope text-base text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  ></i>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    class="w-full pl-9 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/15 text-foreground text-sm placeholder-muted/60 focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
                    placeholder="Votre email"
                  />
                </div>
                @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
                  <span class="text-red-400 text-xs mt-1 block">L'email est obligatoire</span>
                } @else if (form.controls.email.touched && form.controls.email.errors?.['email']) {
                  <span class="text-red-400 text-xs mt-1 block">L'email n'est pas valide</span>
                }
              </div>

              <!-- Password -->
              <div class="mt-3">
                <label for="password" class="block text-xs font-medium text-muted mb-1"
                  >Mot de passe</label
                >
                <div class="relative">
                  <i
                    class="pi pi-lock text-base text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  ></i>
                  <input
                    id="password"
                    type="password"
                    formControlName="password"
                    class="w-full pl-9 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/15 text-foreground text-sm placeholder-muted/60 focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
                    placeholder="Votre mot de passe"
                  />
                </div>
                @if (
                  form.controls.password.touched && form.controls.password.errors?.['required']
                ) {
                  <span class="text-red-400 text-xs mt-1 block"
                    >Le mot de passe est obligatoire</span
                  >
                } @else if (
                  form.controls.password.touched && form.controls.password.errors?.['minlength']
                ) {
                  <span class="text-red-400 text-xs mt-1 block">
                    Le mot de passe doit contenir au moins 6 caractères
                  </span>
                }
              </div>
            </fieldset>

            <button
              type="submit"
              [disabled]="form.invalid || isSubmitting()"
              class="w-full py-2.5 px-4 mt-5 rounded-lg bg-linear-to-r from-blue-600 to-violet-600 text-white text-sm font-medium hover:from-blue-500 hover:to-violet-500 hover:-translate-y-0.5 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
            >
              @if (isSubmitting()) {
                Connexion...
              } @else {
                Se connecter
              }
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div class="mt-5 text-center">
          <a
            routerLink="/"
            class="text-xs text-muted hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <i class="pi pi-arrow-left w-3.5 h-3.5" aria-hidden="true"></i>
            Retour au site
          </a>
        </div>
      </div>
    </main>
  `,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
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

  onSubmit(): void {
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
