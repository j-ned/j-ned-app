import { RouterLink } from '@angular/router';
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  STATIC_CONTACT_INFO,
  STATIC_SOCIAL_LINKS,
} from '@shared/identity/contact-info.static-data';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
  type FieldTree,
} from '@angular/forms/signals';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactFormData } from '@features/contact/domain/models/contact-form.model';
import { composeContactMessage } from '@features/contact/domain/compose-contact-message';
import { CONTACT_TIMELINES } from '@features/contact/domain/contact-timelines.static-data';
import { ToastStore } from '@shared/ui/toast-store';
import { FieldError } from '@shared/ui/field-error';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { ContactInfoPanel } from './components/contact-info-panel';

type ContactFormModel = ContactFormData & {
  readonly projectType: string;
  readonly timeline: string;
};

const EMPTY_CONTACT: ContactFormModel = {
  name: '',
  email: '',
  subject: '',
  message: '',
  projectType: '',
  timeline: '',
};
const SUBJECT_MAX_LENGTH = 200;
const MESSAGE_MAX_LENGTH = 5000;
const MESSAGE_TOO_LONG =
  'Le message ne doit pas dépasser 5\u202f000 caractères, précisions sur le projet comprises';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [FormRoot, FormField, AppIcon, Button, ContactInfoPanel, RouterLink, FieldError],
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
            <p class="mt-5 max-w-[42ch] text-[1.0625rem] text-muted" data-testid="contact-intro">
              {{ intro() }}
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
                  @let nameInError = contactForm.name().touched() && contactForm.name().invalid();
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
                    [attr.aria-invalid]="nameInError"
                    [attr.aria-describedby]="nameInError ? 'contact-name-error' : null"
                    class="form-input"
                  />
                  <app-field-error [field]="contactForm.name" errorId="contact-name-error" />
                </div>
                <div>
                  @let emailInError =
                    contactForm.email().touched() && contactForm.email().invalid();
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
                    [attr.aria-invalid]="emailInError"
                    [attr.aria-describedby]="emailInError ? 'contact-email-error' : null"
                    class="form-input"
                  />
                  <app-field-error [field]="contactForm.email" errorId="contact-email-error" />
                </div>
              </fieldset>
              <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-0 p-0 m-0">
                <legend class="sr-only">Votre projet</legend>
                @if (projectTypes().length) {
                  <div>
                    <label for="project-type" class="form-label"
                      >Type de projet
                      <span class="font-normal text-muted">(facultatif)</span></label
                    >
                    <select
                      id="project-type"
                      data-testid="contact-project-type"
                      [formField]="contactForm.projectType"
                      class="form-input"
                    >
                      <option value="">Non précisé</option>
                      @for (projectType of projectTypes(); track projectType) {
                        <option [value]="projectType">{{ projectType }}</option>
                      }
                    </select>
                  </div>
                }
                <div>
                  <label for="timeline" class="form-label"
                    >Délai souhaité <span class="font-normal text-muted">(facultatif)</span></label
                  >
                  <select
                    id="timeline"
                    data-testid="contact-timeline"
                    [formField]="contactForm.timeline"
                    class="form-input"
                  >
                    <option value="">Non précisé</option>
                    @for (timeline of timelines; track timeline) {
                      <option [value]="timeline">{{ timeline }}</option>
                    }
                  </select>
                </div>
              </fieldset>
              <div>
                @let subjectInError =
                  contactForm.subject().touched() && contactForm.subject().invalid();
                <label for="subject" class="form-label"
                  >Sujet <span class="font-normal text-muted">(requis)</span></label
                >
                <input
                  id="subject"
                  type="text"
                  data-testid="contact-subject"
                  [formField]="contactForm.subject"
                  aria-required="true"
                  placeholder="Objet de votre message"
                  [attr.aria-invalid]="subjectInError"
                  [attr.aria-describedby]="subjectInError ? 'contact-subject-error' : null"
                  class="form-input"
                />
                <app-field-error [field]="contactForm.subject" errorId="contact-subject-error" />
              </div>
              <div>
                @let messageInError =
                  contactForm.message().touched() && contactForm.message().invalid();
                <label for="message" class="form-label"
                  >Message <span class="font-normal text-muted">(requis)</span></label
                >
                <textarea
                  id="message"
                  [formField]="contactForm.message"
                  aria-required="true"
                  rows="6"
                  placeholder="Décrivez votre projet ou votre question..."
                  [attr.aria-invalid]="messageInError"
                  [attr.aria-describedby]="messageInError ? 'contact-message-error' : null"
                  class="form-textarea"
                ></textarea>
                <app-field-error [field]="contactForm.message" errorId="contact-message-error" />
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
                <button appButton type="submit" [disabled]="contactForm().submitting()">
                  @if (contactForm().submitting()) {
                    <app-icon name="spinner" [size]="20" class="animate-spin" />
                    <span>Envoi en cours...</span>
                  } @else {
                    <span>Envoyer le message</span>
                    <app-icon name="send" [size]="20" />
                  }
                </button>
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

  readonly initialSubject = input('');
  readonly projectTypes = input<readonly string[]>([]);
  readonly intro = input(
    'Une question sur un projet, sur le code de ce site ou sur mon parcours\u00a0: je lis et je réponds personnellement.',
  );

  protected readonly contactInfo = STATIC_CONTACT_INFO;
  protected readonly socialLinks = STATIC_SOCIAL_LINKS;
  protected readonly timelines = CONTACT_TIMELINES;

  private readonly _blankContact = computed<ContactFormModel>(() => ({
    ...EMPTY_CONTACT,
    subject: this.initialSubject(),
  }));
  private readonly _model = linkedSignal(() => this._blankContact());

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
      maxLength(path.subject, SUBJECT_MAX_LENGTH, {
        message: `Le sujet ne doit pas dépasser ${SUBJECT_MAX_LENGTH} caractères`,
      });
      required(path.message, { message: 'Le message est obligatoire' });
      minLength(path.message, 10, {
        message: 'Le message doit contenir au moins 10 caractères',
      });
      // Borne de l'API appliquée au message réellement envoyé, préfixe de qualification compris.
      validate(path.message, ({ value, valueOf }) =>
        composeContactMessage({
          message: value(),
          projectType: valueOf(path.projectType),
          timeline: valueOf(path.timeline),
        }).length > MESSAGE_MAX_LENGTH
          ? { kind: 'composedMaxLength', message: MESSAGE_TOO_LONG }
          : null,
      );
    },
    {
      submission: {
        action: (field) => this.send(field),
        // Le bouton reste actif sur un formulaire invalide (un contrôle désactivé n'est ni
        // focusable ni annoncé) : `submit()` révèle les erreurs, on guide vers la première.
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  // Point d'entrée unique, partagé par `FormRoot` (événement submit) et les tests.
  async submitContact(): Promise<void> {
    await submit(this.contactForm);
  }

  private async send(field: FieldTree<ContactFormModel>): Promise<void> {
    const { name, email, subject, message, projectType, timeline } = field().value();
    const payload: ContactFormData = {
      name,
      email,
      subject,
      message: composeContactMessage({ message, projectType, timeline }),
    };
    try {
      const result = await firstValueFrom(this.contactGateway.submitContactForm(payload));
      if (result.success) {
        this.toast.add({ severity: 'success', summary: 'Message envoyé', detail: result.message });
        field().reset(this._blankContact());
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
}
