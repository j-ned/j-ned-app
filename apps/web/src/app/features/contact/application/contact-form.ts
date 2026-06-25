import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { STATIC_CONTACT_INFO, STATIC_SOCIAL_LINKS } from '@shared/identity/contact-info.static-data';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { ToastStore } from '@shared/ui/toast-store';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { ContactInfoPanel } from './components/contact-info-panel';

type ContactFormGroup = {
  name: FormControl<string>;
  email: FormControl<string>;
  subject: FormControl<string>;
  message: FormControl<string>;
};

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ReactiveFormsModule, AppIcon, Button, ContactInfoPanel],
  template: `
    <section class="animate-fade-up py-16 md:py-10 px-6">
      <div class="max-w-5xl mx-auto">
        <header class="text-center mb-14">
          <span
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
          >
            <app-icon name="envelope" [size]="16" />
            Contact
          </span>
          <h2
            class="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style="background: linear-gradient(135deg, var(--color-foreground) 40%, var(--color-primary) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
          >
            Contactez-moi
          </h2>
          <p class="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Vous avez un projet ou une question ? N'hésitez pas à me contacter.
          </p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-stretch">
          <app-contact-info-panel [contactInfo]="contactInfo" [socialLinks]="socialLinks" />
          <div
            class="bg-surface border border-foreground/10 rounded-2xl p-6 md:p-8"
          >
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-6">
              Envoyer un message
            </h3>

            <form [formGroup]="form" (ngSubmit)="submitContact()" class="flex flex-col gap-8">
              <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-6 border-0 p-0 m-0">
                <legend class="sr-only">Informations personnelles</legend>
                <div>
                  <label for="name" class="form-label">Nom complet *</label>
                  <div class="relative">
                    <app-icon name="user" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                      id="name"
                      type="text"
                      formControlName="name"
                      placeholder="Votre nom"
                      autocomplete="name"
                      aria-required="true"
                      [attr.aria-invalid]="form.controls.name.touched && form.controls.name.invalid"
                      [attr.aria-describedby]="form.controls.name.touched && form.controls.name.invalid ? 'contact-name-error' : null"
                      class="form-input pl-9"
                    />
                  </div>
                  @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
                    <p id="contact-name-error" role="alert" class="form-error">Le nom est obligatoire</p>
                  } @else if (
                    form.controls.name.touched && form.controls.name.errors?.['minlength']
                  ) {
                    <p id="contact-name-error" role="alert" class="form-error">
                      Le nom doit contenir au moins 2 caractères
                    </p>
                  }
                </div>

                <div>
                  <label for="email" class="form-label">Email *</label>
                  <div class="relative">
                    <app-icon name="envelope" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      formControlName="email"
                      placeholder="votre@email.com"
                      autocomplete="email"
                      aria-required="true"
                      [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
                      [attr.aria-describedby]="form.controls.email.touched && form.controls.email.invalid ? 'contact-email-error' : null"
                      class="form-input pl-9"
                    />
                  </div>
                  @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
                    <p id="contact-email-error" role="alert" class="form-error">L'email est obligatoire</p>
                  } @else if (
                    form.controls.email.touched && form.controls.email.errors?.['pattern']
                  ) {
                    <p id="contact-email-error" role="alert" class="form-error">
                      Le format de l'email est invalide
                    </p>
                  }
                </div>
              </fieldset>
              <div>
                <label for="subject" class="form-label">Sujet *</label>
                <div class="relative">
                  <app-icon name="pencil" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    id="subject"
                    type="text"
                    formControlName="subject"
                    placeholder="Objet de votre message"
                    aria-required="true"
                    [attr.aria-invalid]="form.controls.subject.touched && form.controls.subject.invalid"
                    [attr.aria-describedby]="form.controls.subject.touched && form.controls.subject.invalid ? 'contact-subject-error' : null"
                    class="form-input pl-9"
                  />
                </div>
                @if (form.controls.subject.touched && form.controls.subject.errors?.['required']) {
                  <p id="contact-subject-error" role="alert" class="form-error">Le sujet est obligatoire</p>
                } @else if (
                  form.controls.subject.touched && form.controls.subject.errors?.['minlength']
                ) {
                  <p id="contact-subject-error" role="alert" class="form-error">
                    Le sujet doit contenir au moins 3 caractères
                  </p>
                }
              </div>
              <div>
                <label for="message" class="form-label">Message *</label>
                <textarea
                  id="message"
                  formControlName="message"
                  rows="6"
                  placeholder="Décrivez votre projet ou votre question..."
                  aria-required="true"
                  [attr.aria-invalid]="form.controls.message.touched && form.controls.message.invalid"
                  [attr.aria-describedby]="form.controls.message.touched && form.controls.message.invalid ? 'contact-message-error' : null"
                  class="form-textarea"
                ></textarea>
                @if (form.controls.message.touched && form.controls.message.errors?.['required']) {
                  <p id="contact-message-error" role="alert" class="form-error">Le message est obligatoire</p>
                } @else if (
                  form.controls.message.touched && form.controls.message.errors?.['minlength']
                ) {
                  <p id="contact-message-error" role="alert" class="form-error">
                    Le message doit contenir au moins 10 caractères
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
                  <app-icon name="spinner" [size]="20" class="animate-spin" />
                  <span>Envoi en cours...</span>
                } @else {
                  <span>Envoyer le message</span>
                  <app-icon name="send" [size]="20" />
                }
              </app-button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ContactForm {
  private readonly contactGateway = inject(ContactGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly contactInfo = STATIC_CONTACT_INFO;
  protected readonly socialLinks = STATIC_SOCIAL_LINKS;

  protected readonly isSubmitting = signal(false);

  readonly form = new FormGroup<ContactFormGroup>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
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

  submitContact(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.contactGateway
      .submitContactForm(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          if (result.success) {
            this.toast.add({
              severity: 'success',
              summary: 'Message envoyé',
              detail: result.message,
            });
            this.form.reset();
          } else {
            this.toast.add({
              severity: 'error',
              summary: 'Envoi impossible',
              detail: result.message,
            });
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Envoi impossible',
            detail: 'Une erreur inattendue est survenue. Réessayez ou contactez-moi par email.',
          });
        },
      });
  }
}
