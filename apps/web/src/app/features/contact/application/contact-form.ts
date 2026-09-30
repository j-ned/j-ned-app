import { RouterLink } from '@angular/router';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  STATIC_CONTACT_INFO,
  STATIC_SOCIAL_LINKS,
} from '@shared/identity/contact-info.static-data';
import {
  FormField,
  FormRoot,
  form,
  minLength,
  pattern,
  required,
  submit,
  type FieldTree,
} from '@angular/forms/signals';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactFormData } from '@features/contact/domain/models/contact-form.model';
import { ToastStore } from '@shared/ui/toast-store';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { ContactInfoPanel } from './components/contact-info-panel';

const EMPTY_CONTACT: ContactFormData = { name: '', email: '', subject: '', message: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [FormRoot, FormField, AppIcon, Button, ContactInfoPanel, RouterLink],
  template: `
    <section class="border-t border-foreground/8 py-26 md:py-34" aria-labelledby="contact-heading">
      <div class="page-container">
        <div
          class="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-20"
        >
          <div>
            <h2
              id="contact-heading"
              class="text-[clamp(2.25rem,4.6vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em]"
            >
              Écrivez-moi.
            </h2>
            <p class="mt-5 max-w-[42ch] text-[1.0625rem] text-muted">
              Une question sur un projet, sur le code de ce site ou sur mon parcours : je lis et je
              réponds personnellement.
            </p>
            <app-contact-info-panel
              class="mt-9"
              [contactInfo]="contactInfo"
              [socialLinks]="socialLinks"
            />
          </div>
          <div class="rounded-xl border border-foreground/8 bg-surface p-7 md:p-9">
            <h3 class="mb-6 text-lg font-semibold tracking-tight">Envoyer un message</h3>

            <form [formRoot]="contactForm" class="flex flex-col gap-6">
              <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-0 p-0 m-0">
                <legend class="sr-only">Informations personnelles</legend>
                <div>
                  @let nameState = contactForm.name();
                  <label for="name" class="form-label"
                    >Nom complet <span class="font-normal text-muted">(requis)</span></label
                  >
                  <input
                    id="name"
                    type="text"
                    [formField]="contactForm.name"
                    aria-required="true"
                    placeholder="Votre nom"
                    autocomplete="name"
                    [attr.aria-invalid]="nameState.touched() && nameState.invalid()"
                    [attr.aria-describedby]="
                      nameState.touched() && nameState.invalid() ? 'contact-name-error' : null
                    "
                    class="form-input"
                  />
                  @if (nameState.touched() && nameState.invalid()) {
                    <p id="contact-name-error" role="alert" class="form-error">
                      {{ nameState.errors()[0].message }}
                    </p>
                  }
                </div>
                <div>
                  @let emailState = contactForm.email();
                  <label for="email" class="form-label"
                    >Email <span class="font-normal text-muted">(requis)</span></label
                  >
                  <input
                    id="email"
                    type="email"
                    [formField]="contactForm.email"
                    aria-required="true"
                    placeholder="votre@email.com"
                    autocomplete="email"
                    [attr.aria-invalid]="emailState.touched() && emailState.invalid()"
                    [attr.aria-describedby]="
                      emailState.touched() && emailState.invalid() ? 'contact-email-error' : null
                    "
                    class="form-input"
                  />
                  @if (emailState.touched() && emailState.invalid()) {
                    <p id="contact-email-error" role="alert" class="form-error">
                      {{ emailState.errors()[0].message }}
                    </p>
                  }
                </div>
              </fieldset>
              <div>
                @let subjectState = contactForm.subject();
                <label for="subject" class="form-label"
                  >Sujet <span class="font-normal text-muted">(requis)</span></label
                >
                <input
                  id="subject"
                  type="text"
                  [formField]="contactForm.subject"
                  aria-required="true"
                  placeholder="Objet de votre message"
                  [attr.aria-invalid]="subjectState.touched() && subjectState.invalid()"
                  [attr.aria-describedby]="
                    subjectState.touched() && subjectState.invalid()
                      ? 'contact-subject-error'
                      : null
                  "
                  class="form-input"
                />
                @if (subjectState.touched() && subjectState.invalid()) {
                  <p id="contact-subject-error" role="alert" class="form-error">
                    {{ subjectState.errors()[0].message }}
                  </p>
                }
              </div>
              <div>
                @let messageState = contactForm.message();
                <label for="message" class="form-label"
                  >Message <span class="font-normal text-muted">(requis)</span></label
                >
                <textarea
                  id="message"
                  [formField]="contactForm.message"
                  aria-required="true"
                  rows="6"
                  placeholder="Décrivez votre projet ou votre question..."
                  [attr.aria-invalid]="messageState.touched() && messageState.invalid()"
                  [attr.aria-describedby]="
                    messageState.touched() && messageState.invalid()
                      ? 'contact-message-error'
                      : null
                  "
                  class="form-textarea"
                ></textarea>
                @if (messageState.touched() && messageState.invalid()) {
                  <p id="contact-message-error" role="alert" class="form-error">
                    {{ messageState.errors()[0].message }}
                  </p>
                }
              </div>
              <div class="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 pt-1">
                <p class="max-w-[34ch] text-[0.8125rem] text-muted">
                  Vos nom, e-mail et message servent uniquement à vous répondre.
                  <a
                    routerLink="/confidentialite"
                    class="underline underline-offset-3 hover:text-primary"
                  >
                    Politique de confidentialité
                  </a>
                </p>
                <app-button
                  type="submit"
                  severity="primary"
                  size="large"
                  [disabled]="contactForm().submitting()"
                >
                  @if (contactForm().submitting()) {
                    <app-icon name="spinner" [size]="20" class="animate-spin" />
                    <span>Envoi en cours...</span>
                  } @else {
                    <span>Envoyer le message</span>
                    <app-icon name="send" [size]="20" />
                  }
                </app-button>
              </div>
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

  protected readonly contactInfo = STATIC_CONTACT_INFO;
  protected readonly socialLinks = STATIC_SOCIAL_LINKS;

  private readonly _model = signal<ContactFormData>(EMPTY_CONTACT);

  // Validation au bord de la saisie : les messages vivent dans le schéma, le template n'affiche
  // que la première erreur du champ touché. `FormField` pose lui-même `required` sur l'élément.
  readonly contactForm = form(
    this._model,
    (path) => {
      required(path.name, { message: 'Le nom est obligatoire' });
      minLength(path.name, 2, { message: 'Le nom doit contenir au moins 2 caractères' });
      required(path.email, { message: "L'email est obligatoire" });
      pattern(path.email, EMAIL_PATTERN, { message: "Format d'email invalide" });
      required(path.subject, { message: 'Le sujet est obligatoire' });
      minLength(path.subject, 3, { message: 'Le sujet doit contenir au moins 3 caractères' });
      required(path.message, { message: 'Le message est obligatoire' });
      minLength(path.message, 10, {
        message: 'Le message doit contenir au moins 10 caractères',
      });
    },
    {
      submission: {
        action: (field) => this.send(field),
        // Le bouton reste actif sur un formulaire invalide (un contrôle désactivé n'est ni
        // focusable ni annoncé) : `submit()` révèle les erreurs, on guide vers la première.
        onInvalid: (field) => this.focusFirstInvalidField(field),
      },
    },
  );

  // Point d'entrée unique, partagé par `FormRoot` (événement submit) et les tests.
  async submitContact(): Promise<void> {
    await submit(this.contactForm);
  }

  private async send(field: FieldTree<ContactFormData>): Promise<void> {
    try {
      const result = await firstValueFrom(this.contactGateway.submitContactForm(field().value()));
      if (result.success) {
        this.toast.add({ severity: 'success', summary: 'Message envoyé', detail: result.message });
        field().reset(EMPTY_CONTACT);
      } else {
        this.toast.add({ severity: 'error', summary: 'Envoi impossible', detail: result.message });
      }
    } catch {
      this.toast.add({
        severity: 'error',
        summary: 'Envoi impossible',
        detail: 'Une erreur inattendue est survenue. Réessayez ou contactez-moi par email.',
      });
    }
  }

  private focusFirstInvalidField(field: FieldTree<ContactFormData>): void {
    const firstInvalid = [field.name, field.email, field.subject, field.message].find((f) =>
      f().invalid(),
    );
    firstInvalid?.().focusBoundControl();
  }
}
