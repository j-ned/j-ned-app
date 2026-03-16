import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CONTACT_GATEWAY } from './tokens';
import { ToastService } from '@shared/toast';

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
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section id="contact" class="py-20 px-6">
      <div class="max-w-5xl mx-auto">
        <header class="text-center mb-14">
          <span
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
          >
            <svg aria-hidden="true" class="w-4 h-4">
              <use href="/icons/sprite.svg#lucide-mail"></use>
            </svg>
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
          <aside
            class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between gap-6"
          >
            @if (contactInfo()) {
              <address class="space-y-4 not-italic">
                <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">
                  Coordonnées
                </h3>

                <a
                  [href]="'mailto:' + contactInfo()!.email"
                  class="group flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors duration-200"
                >
                  <div
                    class="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  >
                    <svg class="w-4 h-4 text-primary" aria-hidden="true">
                      <use href="/icons/sprite.svg#lucide-mail" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs text-muted">Email</p>
                    <p
                      class="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate"
                    >
                      {{ contactInfo()!.email }}
                    </p>
                  </div>
                </a>

                <a
                  [href]="'tel:' + contactInfo()!.phone"
                  class="group flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors duration-200"
                >
                  <div
                    class="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  >
                    <svg class="w-4 h-4 text-accent" aria-hidden="true">
                      <use href="/icons/sprite.svg#lucide-phone" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs text-muted">Téléphone</p>
                    <p
                      class="text-sm font-medium text-foreground group-hover:text-accent transition-colors"
                    >
                      {{ contactInfo()!.phone }}
                    </p>
                  </div>
                </a>

                <div class="flex items-center gap-3 p-3 rounded-xl">
                  <div
                    class="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-green-500/20 to-green-500/5 flex items-center justify-center"
                  >
                    <svg class="w-4 h-4 text-green-500" aria-hidden="true">
                      <use href="/icons/sprite.svg#lucide-map-pin" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs text-muted">Localisation</p>
                    <p class="text-sm font-medium text-foreground">
                      {{ contactInfo()!.location }}
                    </p>
                  </div>
                </div>
              </address>
            }
            <hr class="border-t border-foreground/10" />
            <div class="space-y-3">
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">
                Retrouvez-moi
              </h3>
              <nav class="flex items-center gap-2" aria-label="Réseaux sociaux">
                @if (socialLinks().linkedin.url) {
                  <a
                    [href]="socialLinks().linkedin.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-primary/30 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().linkedin.label"
                  >
                    <svg
                      aria-hidden="true"
                      class="w-4 h-4 text-muted group-hover:text-primary transition-colors"
                    >
                      <use [attr.href]="'/icons/sprite.svg#' + socialLinks().linkedin.icon" />
                    </svg>
                  </a>
                }
                @if (socialLinks().github.url) {
                  <a
                    [href]="socialLinks().github.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().github.label"
                  >
                    <svg
                      aria-hidden="true"
                      class="w-4 h-4 text-muted group-hover:text-foreground transition-colors"
                    >
                      <use [attr.href]="'/icons/sprite.svg#' + socialLinks().github.icon" />
                    </svg>
                  </a>
                }
                @if (socialLinks().twitter.url) {
                  <a
                    [href]="socialLinks().twitter.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().twitter.label"
                  >
                    <svg
                      aria-hidden="true"
                      class="w-4 h-4 text-muted group-hover:text-foreground transition-colors"
                    >
                      <use [attr.href]="'/icons/sprite.svg#' + socialLinks().twitter.icon" />
                    </svg>
                  </a>
                }
                @if (socialLinks().email.url) {
                  <a
                    [href]="socialLinks().email.url"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-primary/30 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().email.label"
                  >
                    <svg
                      aria-hidden="true"
                      class="w-4 h-4 text-muted group-hover:text-primary transition-colors"
                    >
                      <use [attr.href]="'/icons/sprite.svg#' + socialLinks().email.icon" />
                    </svg>
                  </a>
                }
                @if (socialLinks().phone.url) {
                  <a
                    [href]="socialLinks().phone.url"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-accent/30 hover:bg-accent/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().phone.label"
                  >
                    <svg
                      aria-hidden="true"
                      class="w-4 h-4 text-muted group-hover:text-accent transition-colors"
                    >
                      <use [attr.href]="'/icons/sprite.svg#' + socialLinks().phone.icon" />
                    </svg>
                  </a>
                }
              </nav>
            </div>
            <hr class="border-t border-foreground/10" />
            <a
              routerLink="/booking"
              class="group flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors duration-200"
            >
              <div
                class="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              >
                <svg class="w-4 h-4 text-violet-400" aria-hidden="true">
                  <use href="/icons/sprite.svg#lucide-calendar" />
                </svg>
              </div>
              <div>
                <p
                  class="text-sm font-medium text-foreground group-hover:text-violet-400 transition-colors"
                >
                  Réserver un créneau
                </p>
                <p class="text-xs text-muted">Planifiez un appel découverte</p>
              </div>
            </a>
          </aside>
          <div
            class="bg-background/80 backdrop-blur-md border border-foreground/10 rounded-2xl p-6 md:p-8 shadow-lg"
          >
            <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-6">
              Envoyer un message
            </h3>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-5 border-0 p-0 m-0">
                <legend class="sr-only">Informations personnelles</legend>
                <div>
                  <label for="name" class="block text-sm font-medium text-foreground mb-1.5">
                    Nom complet *
                  </label>
                  <div class="relative">
                    <svg
                      class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    >
                      <use href="/icons/sprite.svg#lucide-user" />
                    </svg>
                    <input
                      id="name"
                      type="text"
                      formControlName="name"
                      class="w-full pl-9 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                      placeholder="Votre nom"
                    />
                  </div>
                  @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
                    <span class="text-red-400 text-xs mt-1 block">Le nom est obligatoire</span>
                  } @else if (
                    form.controls.name.touched && form.controls.name.errors?.['minlength']
                  ) {
                    <span class="text-red-400 text-xs mt-1 block">
                      Le nom doit contenir au moins 2 caractères
                    </span>
                  }
                </div>

                <div>
                  <label for="email" class="block text-sm font-medium text-foreground mb-1.5">
                    Email *
                  </label>
                  <div class="relative">
                    <svg
                      class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    >
                      <use href="/icons/sprite.svg#lucide-mail" />
                    </svg>
                    <input
                      id="email"
                      type="email"
                      formControlName="email"
                      class="w-full pl-9 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                      placeholder="votre@email.com"
                    />
                  </div>
                  @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
                    <span class="text-red-400 text-xs mt-1 block">L'email est obligatoire</span>
                  } @else if (
                    form.controls.email.touched && form.controls.email.errors?.['pattern']
                  ) {
                    <span class="text-red-400 text-xs mt-1 block">
                      Le format de l'email est invalide
                    </span>
                  }
                </div>
              </fieldset>
              <div>
                <label for="subject" class="block text-sm font-medium text-foreground mb-1.5">
                  Sujet *
                </label>
                <div class="relative">
                  <svg
                    class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <use href="/icons/sprite.svg#lucide-pen-line" />
                  </svg>
                  <input
                    id="subject"
                    type="text"
                    formControlName="subject"
                    class="w-full pl-9 pr-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                    placeholder="Objet de votre message"
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
                <label for="message" class="block text-sm font-medium text-foreground mb-1.5">
                  Message *
                </label>
                <textarea
                  id="message"
                  formControlName="message"
                  rows="6"
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
              <button
                type="submit"
                [disabled]="form.invalid || isSubmitting()"
                class="w-full py-3 px-6 rounded-lg bg-linear-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-700 hover:to-violet-700 hover:-translate-y-0.5 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
              >
                @if (isSubmitting()) {
                  <svg class="w-5 h-5 animate-spin" aria-hidden="true">
                    <use href="/icons/sprite.svg#lucide-loader-2" />
                  </svg>
                  Envoi en cours...
                } @else {
                  <svg class="w-5 h-5" aria-hidden="true">
                    <use href="/icons/sprite.svg#lucide-send" />
                  </svg>
                  Envoyer le message
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ContactForm {
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly contactInfoResource = rxResource({
    stream: () => this.contactGateway.getContactInfo(),
  });
  protected readonly contactInfo = computed(() => this.contactInfoResource.value());

  private readonly socialLinksResource = rxResource({
    stream: () => this.contactGateway.getSocialLinks(),
  });
  protected readonly socialLinks = computed(
    () =>
      this.socialLinksResource.value() ?? {
        linkedin: { url: '', label: '', icon: '' },
        github: { url: '', label: '', icon: '' },
        email: { url: '', label: '', icon: '' },
        phone: { url: '', label: '', icon: '' },
        twitter: { url: '', label: '', icon: '' },
      },
  );

  readonly isSubmitting = signal(false);

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

  onSubmit(): void {
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
            this.toast.success(result.message);
            this.form.reset();
          } else {
            this.toast.error(result.message);
          }
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
