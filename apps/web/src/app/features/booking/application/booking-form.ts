import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Message } from 'primeng/message';

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
  imports: [ReactiveFormsModule, Button, InputText, Textarea, IconField, InputIcon, Message],
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

          <div class="flex flex-col gap-1.5">
            <label for="booking-name" class="text-sm font-medium text-foreground">
              Nom complet *
            </label>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-user" />
              <input
                id="booking-name"
                pInputText
                type="text"
                formControlName="name"
                placeholder="Votre nom"
                fluid
              />
            </p-iconfield>
            @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
              <p-message
                severity="error"
                text="Le nom est obligatoire"
                size="small"
                variant="simple"
              />
            } @else if (form.controls.name.touched && form.controls.name.errors?.['minlength']) {
              <p-message
                severity="error"
                text="Le nom doit contenir au moins 2 caractères"
                size="small"
                variant="simple"
              />
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="booking-email" class="text-sm font-medium text-foreground">Email *</label>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-envelope" />
              <input
                id="booking-email"
                pInputText
                type="email"
                formControlName="email"
                placeholder="votre@email.com"
                fluid
              />
            </p-iconfield>
            @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
              <p-message
                severity="error"
                text="L'email est obligatoire"
                size="small"
                variant="simple"
              />
            } @else if (form.controls.email.touched && form.controls.email.errors?.['pattern']) {
              <p-message
                severity="error"
                text="Le format de l'email est invalide"
                size="small"
                variant="simple"
              />
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="booking-phone" class="text-sm font-medium text-foreground">
              Téléphone *
            </label>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-phone" />
              <input
                id="booking-phone"
                pInputText
                type="tel"
                formControlName="phone"
                placeholder="06 12 34 56 78"
                fluid
              />
            </p-iconfield>
            @if (form.controls.phone.touched && form.controls.phone.errors?.['required']) {
              <p-message
                severity="error"
                text="Le téléphone est obligatoire"
                size="small"
                variant="simple"
              />
            } @else if (form.controls.phone.touched && form.controls.phone.errors?.['pattern']) {
              <p-message
                severity="error"
                text="Le numéro doit contenir 10 chiffres"
                size="small"
                variant="simple"
              />
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="booking-subject" class="text-sm font-medium text-foreground">Sujet *</label>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-pencil" />
              <input
                id="booking-subject"
                pInputText
                type="text"
                formControlName="subject"
                placeholder="Objet de la consultation"
                fluid
              />
            </p-iconfield>
            @if (form.controls.subject.touched && form.controls.subject.errors?.['required']) {
              <p-message
                severity="error"
                text="Le sujet est obligatoire"
                size="small"
                variant="simple"
              />
            } @else if (
              form.controls.subject.touched && form.controls.subject.errors?.['minlength']
            ) {
              <p-message
                severity="error"
                text="Le sujet doit contenir au moins 3 caractères"
                size="small"
                variant="simple"
              />
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="booking-message" class="text-sm font-medium text-foreground">
              Message *
            </label>
            <textarea
              id="booking-message"
              pTextarea
              formControlName="message"
              rows="4"
              placeholder="Décrivez votre projet ou votre question..."
            ></textarea>
            @if (form.controls.message.touched && form.controls.message.errors?.['required']) {
              <p-message
                severity="error"
                text="Le message est obligatoire"
                size="small"
                variant="simple"
              />
            } @else if (
              form.controls.message.touched && form.controls.message.errors?.['minlength']
            ) {
              <p-message
                severity="error"
                text="Le message doit contenir au moins 10 caractères"
                size="small"
                variant="simple"
              />
            }
          </div>
        </fieldset>

        <p-button
          type="submit"
          [label]="isSubmitting() ? 'Réservation en cours...' : 'Confirmer la réservation'"
          [icon]="isSubmitting() ? 'pi pi-spinner pi-spin' : 'pi pi-check'"
          iconPos="right"
          [disabled]="form.invalid"
          [loading]="isSubmitting()"
          size="large"
          styleClass="w-full mt-2"
        />
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
