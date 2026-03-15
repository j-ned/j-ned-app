import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

type BookingFormGroup = {
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  subject: FormControl<string>;
  message: FormControl<string>;
};

export type BookingFormPayload = {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
};

@Component({
  selector: 'app-booking-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ReactiveFormsModule],
  template: `
    <div
      class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 md:p-8 shadow-lg h-full"
    >
      <output
        class="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 block"
      >
        <svg class="w-5 h-5 text-primary shrink-0" aria-hidden="true">
          <use href="/icons/sprite.svg#lucide-calendar" />
        </svg>
        <div class="text-sm">
          <span class="font-medium text-foreground">{{ formattedDate() }}</span>
          <span class="text-muted mx-1">·</span>
          <span class="text-foreground">{{ selectedTime() }}</span>
          <span class="text-muted mx-1">·</span>
          <span class="text-muted">{{ selectedDuration() }} min</span>
        </div>
      </output>

      <h2 class="text-lg font-bold text-foreground mb-6">Vos coordonnées</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <fieldset class="space-y-6 border-0 p-0 m-0">
          <legend class="sr-only">Vos coordonnées</legend>

          <div>
            <label for="booking-name" class="block text-sm font-medium text-foreground mb-1.5">
              Nom complet *
            </label>
            <div class="relative">
              <svg
                class="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <use href="/icons/sprite.svg#lucide-user" />
              </svg>
              <input
                id="booking-name"
                type="text"
                formControlName="name"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                placeholder="Votre nom"
              />
            </div>
            @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">Le nom est obligatoire</span>
            } @else if (form.controls.name.touched && form.controls.name.errors?.['minlength']) {
              <span class="text-red-400 text-xs mt-1 block">
                Le nom doit contenir au moins 2 caractères
              </span>
            }
          </div>

          <div>
            <label for="booking-email" class="block text-sm font-medium text-foreground mb-1.5">
              Email *
            </label>
            <div class="relative">
              <svg
                class="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <use href="/icons/sprite.svg#lucide-mail" />
              </svg>
              <input
                id="booking-email"
                type="email"
                formControlName="email"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                placeholder="votre@email.com"
              />
            </div>
            @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">L'email est obligatoire</span>
            } @else if (form.controls.email.touched && form.controls.email.errors?.['pattern']) {
              <span class="text-red-400 text-xs mt-1 block">
                Le format de l'email est invalide
              </span>
            }
          </div>

          <div>
            <label for="booking-phone" class="block text-sm font-medium text-foreground mb-1.5">
              Téléphone *
            </label>
            <div class="relative">
              <svg
                class="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <use href="/icons/sprite.svg#lucide-phone" />
              </svg>
              <input
                id="booking-phone"
                type="tel"
                formControlName="phone"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                placeholder="06 12 34 56 78"
              />
            </div>
            @if (form.controls.phone.touched && form.controls.phone.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">Le téléphone est obligatoire</span>
            } @else if (form.controls.phone.touched && form.controls.phone.errors?.['pattern']) {
              <span class="text-red-400 text-xs mt-1 block">
                Le numéro doit contenir 10 chiffres
              </span>
            }
          </div>

          <div>
            <label for="booking-subject" class="block text-sm font-medium text-foreground mb-1.5">
              Sujet *
            </label>
            <div class="relative">
              <svg
                class="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <use href="/icons/sprite.svg#lucide-pen-line" />
              </svg>
              <input
                id="booking-subject"
                type="text"
                formControlName="subject"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                placeholder="Objet de la consultation"
              />
            </div>
            @if (form.controls.subject.touched && form.controls.subject.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">Le sujet est obligatoire</span>
            } @else if (
              form.controls.subject.touched && form.controls.subject.errors?.['minlength']
            ) {
              <span class="text-red-400 text-xs mt-1 block">
                Le sujet doit contenir au moins 3 caractères
              </span>
            }
          </div>

          <div>
            <label for="booking-message" class="block text-sm font-medium text-foreground mb-1.5">
              Message *
            </label>
            <textarea
              id="booking-message"
              formControlName="message"
              rows="4"
              class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-none"
              placeholder="Décrivez votre projet ou votre question..."
            ></textarea>
            @if (form.controls.message.touched && form.controls.message.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">Le message est obligatoire</span>
            } @else if (
              form.controls.message.touched && form.controls.message.errors?.['minlength']
            ) {
              <span class="text-red-400 text-xs mt-1 block">
                Le message doit contenir au moins 10 caractères
              </span>
            }
          </div>
        </fieldset>

        <button
          type="submit"
          [disabled]="form.invalid || isSubmitting()"
          class="w-full mt-2 py-3 px-6 rounded-lg bg-linear-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-700 hover:to-violet-700 hover:-translate-y-0.5 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
        >
          @if (isSubmitting()) {
            <svg class="w-5 h-5 animate-spin" aria-hidden="true">
              <use href="/icons/sprite.svg#spinners" />
            </svg>
            Réservation en cours...
          } @else {
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-check" />
            </svg>
            Confirmer la réservation
          }
        </button>
      </form>
    </div>
  `,
})
export class BookingForm {
  readonly selectedDate = input.required<string>();
  readonly selectedTime = input.required<string>();
  readonly selectedDuration = input.required<number>();
  readonly formSubmitted = output<BookingFormPayload>();

  readonly isSubmitting = signal(false);

  readonly form = new FormGroup<BookingFormGroup>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{10}$/)],
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });

  readonly formattedDate = computed(() => {
    const date = new Date(this.selectedDate() + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmitted.emit(this.form.getRawValue());
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  resetForm(): void {
    this.form.reset();
  }
}
