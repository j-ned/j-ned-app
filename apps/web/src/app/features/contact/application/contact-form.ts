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
import { ToastService } from '@shared/ui';
import { PiIconPipe } from '@shared/icons';

type ContactFormGroup = {
  name: FormControl<string>;
  email: FormControl<string>;
  subject: FormControl<string>;
  message: FormControl<string>;
};

const INPUT_BASE =
  'w-full py-2.5 bg-foreground/5 border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors';
const INPUT_PADDED = `${INPUT_BASE} pl-10 pr-4`;
const TEXTAREA_PADDED = `${INPUT_BASE} px-4 resize-y`;

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ReactiveFormsModule, RouterLink, PiIconPipe],
  template: `
    <section id="contact" class="py-20 px-6">
      <div class="max-w-5xl mx-auto">
        <header class="text-center mb-14">
          <span
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-5"
          >
            <i class="pi pi-envelope text-base" aria-hidden="true"></i>
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
                    <i class="pi pi-envelope text-base text-primary" aria-hidden="true"></i>
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
                    <i class="pi pi-phone text-base text-accent" aria-hidden="true"></i>
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
                    <i class="pi pi-map-marker text-base text-green-500" aria-hidden="true"></i>
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
                    <i
                      class="text-base text-muted group-hover:text-primary transition-colors"
                      [class]="socialLinks().linkedin.icon | piIcon"
                      aria-hidden="true"
                    ></i>
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
                    <i
                      class="text-base text-muted group-hover:text-foreground transition-colors"
                      [class]="socialLinks().github.icon | piIcon"
                      aria-hidden="true"
                    ></i>
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
                    <i
                      class="text-base text-muted group-hover:text-foreground transition-colors"
                      [class]="socialLinks().twitter.icon | piIcon"
                      aria-hidden="true"
                    ></i>
                  </a>
                }
                @if (socialLinks().email.url) {
                  <a
                    [href]="socialLinks().email.url"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-primary/30 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().email.label"
                  >
                    <i
                      class="text-base text-muted group-hover:text-primary transition-colors"
                      [class]="socialLinks().email.icon | piIcon"
                      aria-hidden="true"
                    ></i>
                  </a>
                }
                @if (socialLinks().phone.url) {
                  <a
                    [href]="socialLinks().phone.url"
                    class="group flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-accent/30 hover:bg-accent/10 transition-all duration-300 hover:scale-110"
                    [attr.aria-label]="socialLinks().phone.label"
                  >
                    <i
                      class="text-base text-muted group-hover:text-accent transition-colors"
                      [class]="socialLinks().phone.icon | piIcon"
                      aria-hidden="true"
                    ></i>
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
                <i class="pi pi-calendar text-base text-violet-400" aria-hidden="true"></i>
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

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
              <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-5 border-0 p-0 m-0">
                <legend class="sr-only">Informations personnelles</legend>
                <div class="flex flex-col gap-1.5">
                  <label for="name" class="text-sm font-medium text-foreground">
                    Nom complet *
                  </label>
                  <div class="relative">
                    <i
                      class="pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none"
                      aria-hidden="true"
                    ></i>
                    <input
                      id="name"
                      type="text"
                      formControlName="name"
                      placeholder="Votre nom"
                      autocomplete="name"
                      aria-required="true"
                      [class]="inputClass('name')"
                    />
                  </div>
                  @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
                    <p role="alert" class="text-xs text-red-400">Le nom est obligatoire</p>
                  } @else if (
                    form.controls.name.touched && form.controls.name.errors?.['minlength']
                  ) {
                    <p role="alert" class="text-xs text-red-400">Le nom doit contenir au moins 2 caractères</p>
                  }
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="email" class="text-sm font-medium text-foreground">Email *</label>
                  <div class="relative">
                    <i
                      class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none"
                      aria-hidden="true"
                    ></i>
                    <input
                      id="email"
                      type="email"
                      formControlName="email"
                      placeholder="votre@email.com"
                      autocomplete="email"
                      aria-required="true"
                      [class]="inputClass('email')"
                    />
                  </div>
                  @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
                    <p role="alert" class="text-xs text-red-400">L'email est obligatoire</p>
                  } @else if (
                    form.controls.email.touched && form.controls.email.errors?.['pattern']
                  ) {
                    <p role="alert" class="text-xs text-red-400">Le format de l'email est invalide</p>
                  }
                </div>
              </fieldset>
              <div class="flex flex-col gap-1.5">
                <label for="subject" class="text-sm font-medium text-foreground">Sujet *</label>
                <div class="relative">
                  <i
                    class="pi pi-pencil absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none"
                    aria-hidden="true"
                  ></i>
                  <input
                    id="subject"
                    type="text"
                    formControlName="subject"
                    placeholder="Objet de votre message"
                    aria-required="true"
                    [class]="inputClass('subject')"
                  />
                </div>
                @if (form.controls.subject.touched && form.controls.subject.errors?.['required']) {
                  <p role="alert" class="text-xs text-red-400">Le sujet est obligatoire</p>
                } @else if (
                  form.controls.subject.touched && form.controls.subject.errors?.['minlength']
                ) {
                  <p role="alert" class="text-xs text-red-400">Le sujet doit contenir au moins 3 caractères</p>
                }
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="message" class="text-sm font-medium text-foreground">Message *</label>
                <textarea
                  id="message"
                  formControlName="message"
                  rows="6"
                  placeholder="Décrivez votre projet ou votre question..."
                  aria-required="true"
                  [class]="inputClass('message', 'textarea')"
                ></textarea>
                @if (form.controls.message.touched && form.controls.message.errors?.['required']) {
                  <p role="alert" class="text-xs text-red-400">Le message est obligatoire</p>
                } @else if (
                  form.controls.message.touched && form.controls.message.errors?.['minlength']
                ) {
                  <p role="alert" class="text-xs text-red-400">Le message doit contenir au moins 10 caractères</p>
                }
              </div>
              <button
                type="submit"
                [disabled]="form.invalid || isSubmitting()"
                class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-bg text-white font-semibold shadow-md hover:bg-primary-bg/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                @if (isSubmitting()) {
                  <i class="pi pi-spinner pi-spin" aria-hidden="true"></i>
                  <span>Envoi en cours...</span>
                } @else {
                  <span>Envoyer le message</span>
                  <i class="pi pi-send" aria-hidden="true"></i>
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

  protected inputClass(controlName: keyof ContactFormGroup, variant: 'input' | 'textarea' = 'input'): string {
    const control = this.form.controls[controlName];
    const hasError = control.touched && control.invalid;
    const borderClass = hasError
      ? 'border-red-400/60 focus:ring-red-400/40'
      : 'border-foreground/10 focus:border-primary/50';
    const base = variant === 'textarea' ? TEXTAREA_PADDED : INPUT_PADDED;
    return `${base} ${borderClass}`;
  }

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
            detail:
              "Une erreur inattendue est survenue. Réessayez ou contactez-moi par email.",
          });
        },
      });
  }
}
