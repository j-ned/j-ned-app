import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../domain';

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
      <div
        class="w-full max-w-md bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-8 shadow-2xl"
      >
        <!-- Icon -->
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center"
          >
            <svg class="w-8 h-8 text-primary" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-shield-user" />
            </svg>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-foreground mb-2 text-center">Connexion Admin</h1>
        <p class="text-muted text-sm text-center mb-8">Accédez au tableau de bord</p>

        @if (errorMessage()) {
          <div
            class="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
          >
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-foreground mb-1.5"
              >Email</label
            >
            <div class="relative">
              <svg
                class="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <use href="/icons/sprite.svg#lucide-mail" />
              </svg>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                placeholder="Votre email"
              />
            </div>
            @if (form.controls.email.touched && form.controls.email.hasError('required')) {
              <span class="text-red-400 text-xs mt-1 block">L'email est obligatoire</span>
            }
            @if (form.controls.email.touched && form.controls.email.hasError('email')) {
              <span class="text-red-400 text-xs mt-1 block">L'email n'est pas valide</span>
            }
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-foreground mb-1.5"
              >Mot de passe</label
            >
            <div class="relative">
              <svg
                class="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <use href="/icons/sprite.svg#lucide-lock" />
              </svg>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                placeholder="Votre mot de passe"
              />
            </div>
            @if (form.controls.password.touched && form.controls.password.hasError('required')) {
              <span class="text-red-400 text-xs mt-1 block">Le mot de passe est obligatoire</span>
            }
            @if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
              <span class="text-red-400 text-xs mt-1 block">
                Le mot de passe doit contenir au moins 6 caractères
              </span>
            }
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting()"
            class="w-full py-2.5 px-4 rounded-lg bg-linear-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-700 hover:to-violet-700 hover:-translate-y-0.5 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
          >
            @if (isSubmitting()) {
              Connexion...
            } @else {
              Se connecter
            }
          </button>
        </form>

        <nav class="mt-6 text-center">
          <a routerLink="/" class="text-sm text-muted hover:text-primary transition-colors">
            Retour au site
          </a>
        </nav>
      </div>
    </main>
  `,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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

    this.authService.login(email, password).subscribe({
      next: (success) => {
        this.isSubmitting.set(false);
        if (success) {
          this.router.navigate(['/admin']);
        } else {
          this.errorMessage.set('Email ou mot de passe incorrect');
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Erreur de connexion au serveur');
      },
    });
  }
}
