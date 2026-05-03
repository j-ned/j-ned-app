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
        <i class="pi pi-calendar text-xl text-primary shrink-0" aria-hidden="true"></i>
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
            <label for="booking-name" class="form-label">
              Nom complet <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="booking-name"
              type="text"
              formControlName="name"
              placeholder="Votre nom"
              autocomplete="name"
              aria-required="true"
              class="form-input"
              [attr.aria-invalid]="form.controls.name.touched && form.controls.name.invalid"
            />
            @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
              <small role="alert" class="form-error">Le nom est obligatoire.</small>
            } @else if (form.controls.name.touched && form.controls.name.errors?.['minlength']) {
              <small role="alert" class="form-error">
                Le nom doit contenir au moins 2 caractères.
              </small>
            }
          </div>

          <div>
            <label for="booking-email" class="form-label">
              Email <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="booking-email"
              type="email"
              formControlName="email"
              placeholder="votre@email.com"
              autocomplete="email"
              aria-required="true"
              class="form-input"
              [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
            />
            @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
              <small role="alert" class="form-error">L'email est obligatoire.</small>
            } @else if (form.controls.email.touched && form.controls.email.errors?.['pattern']) {
              <small role="alert" class="form-error">Le format de l'email est invalide.</small>
            }
          </div>

          <div>
            <label for="booking-phone" class="form-label">
              Téléphone <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="booking-phone"
              type="tel"
              formControlName="phone"
              placeholder="06 12 34 56 78"
              autocomplete="tel"
              aria-required="true"
              class="form-input"
              [attr.aria-invalid]="form.controls.phone.touched && form.controls.phone.invalid"
            />
            @if (form.controls.phone.touched && form.controls.phone.errors?.['required']) {
              <small role="alert" class="form-error">Le téléphone est obligatoire.</small>
            } @else if (form.controls.phone.touched && form.controls.phone.errors?.['pattern']) {
              <small role="alert" class="form-error">Le numéro doit contenir 10 chiffres.</small>
            }
          </div>

          <div>
            <label for="booking-subject" class="form-label">
              Sujet <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="booking-subject"
              type="text"
              formControlName="subject"
              placeholder="Objet de la consultation"
              aria-required="true"
              class="form-input"
              [attr.aria-invalid]="form.controls.subject.touched && form.controls.subject.invalid"
            />
            @if (form.controls.subject.touched && form.controls.subject.errors?.['required']) {
              <small role="alert" class="form-error">Le sujet est obligatoire.</small>
            } @else if (
              form.controls.subject.touched && form.controls.subject.errors?.['minlength']
            ) {
              <small role="alert" class="form-error">
                Le sujet doit contenir au moins 3 caractères.
              </small>
            }
          </div>

          <div>
            <label for="booking-message" class="form-label">
              Message <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="booking-message"
              formControlName="message"
              rows="4"
              placeholder="Décrivez votre projet ou votre question..."
              aria-required="true"
              class="form-textarea"
              [attr.aria-invalid]="form.controls.message.touched && form.controls.message.invalid"
            ></textarea>
            @if (form.controls.message.touched && form.controls.message.errors?.['required']) {
              <small role="alert" class="form-error">Le message est obligatoire.</small>
            } @else if (
              form.controls.message.touched && form.controls.message.errors?.['minlength']
            ) {
              <small role="alert" class="form-error">
                Le message doit contenir au moins 10 caractères.
              </small>
            }
          </div>
        </fieldset>

        <button
          type="submit"
          [disabled]="form.invalid || isSubmitting()"
          class="btn-primary w-full mt-2"
        >
          @if (isSubmitting()) {
            <i class="pi pi-spinner pi-spin mr-2" aria-hidden="true"></i>
            Réservation en cours...
          } @else {
            Confirmer la réservation
            <i class="pi pi-check ml-2" aria-hidden="true"></i>
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
