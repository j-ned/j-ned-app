import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CONTACT_GATEWAY } from '../../core/contact/gateways';

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section id="contact" class="py-20 px-6 bg-linear-to-b from-transparent to-white/5">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Contactez-moi</h2>
          <p class="text-lg text-muted/80">
            Vous avez un projet ou une question ? N'hésitez pas à me contacter
          </p>
        </div>

        <div class="mb-16">
          <div
            class="flex items-center justify-center gap-6 p-6 rounded-3xl bg-linear-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-md shadow-xl"
          >
            <a
              [href]="socialLinks().linkedin.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 hover:bg-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25"
              [attr.aria-label]="socialLinks().linkedin.label"
            >
              <svg class="w-6 h-6 text-foreground/80 group-hover:text-white transition-colors">
                <use [attr.href]="'/icons/sprite.svg#' + socialLinks().linkedin.icon"></use>
              </svg>
            </a>

            <a
              [href]="socialLinks().github.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 hover:bg-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25"
              [attr.aria-label]="socialLinks().github.label"
            >
              <svg class="w-6 h-6 text-foreground/80 group-hover:text-white transition-colors">
                <use [attr.href]="'/icons/sprite.svg#' + socialLinks().github.icon"></use>
              </svg>
            </a>

            <a
              [href]="socialLinks().email.url"
              class="group flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 hover:bg-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25"
              [attr.aria-label]="socialLinks().email.label"
            >
              <svg class="w-6 h-6 text-foreground/80 group-hover:text-white transition-colors">
                <use [attr.href]="'/icons/sprite.svg#' + socialLinks().email.icon"></use>
              </svg>
            </a>

            <a
              [href]="socialLinks().phone.url"
              class="group flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 hover:bg-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25"
              [attr.aria-label]="socialLinks().phone.label"
            >
              <svg class="w-6 h-6 text-foreground/80 group-hover:text-white transition-colors">
                <use [attr.href]="'/icons/sprite.svg#' + socialLinks().phone.icon"></use>
              </svg>
            </a>

            <a
              [href]="socialLinks().twitter.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 hover:bg-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/25"
              [attr.aria-label]="socialLinks().twitter.label"
            >
              <svg class="w-6 h-6 text-foreground/80 group-hover:text-white transition-colors">
                <use [attr.href]="'/icons/sprite.svg#' + socialLinks().twitter.icon"></use>
              </svg>
            </a>
          </div>
        </div>

        <div
          class="bg-linear-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-sm shadow-2xl"
        >
          <div class="text-center space-y-8">
            <div>
              <h3 class="text-lg font-semibold mb-3 text-muted/80">Email</h3>
              <a
                [href]="'mailto:' + contactInfo().email"
                class="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {{ contactInfo().email }}
              </a>
            </div>

            <div>
              <h3 class="text-lg font-semibold mb-3 text-muted/80">Téléphone</h3>
              <a
                [href]="'tel:' + contactInfo().phone"
                class="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {{ contactInfo().phone }}
              </a>
            </div>

            <div>
              <h3 class="text-lg font-semibold mb-3 text-muted/80">Localisation</h3>
              <p class="text-xl text-foreground/90">{{ contactInfo().location }}</p>
            </div>

            <div class="pt-6">
              <a
                [href]="'mailto:' + contactInfo().email + '?subject=Contact depuis votre portfolio'"
                class="inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-linear-to-br from-primary to-accent rounded-xl hover:from-blue-600 hover:to-violet-600 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-accent/25"
              >
                <svg class="w-6 h-6">
                  <use href="/icons/sprite.svg#lucide-mail"></use>
                </svg>
                M'envoyer un email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ContactForm {
  private contactGateway = inject(CONTACT_GATEWAY);

  private contactInfoResource = this.contactGateway.getContactInfo();
  protected readonly contactInfo = computed(() => this.contactInfoResource.value());

  private socialLinksObservable = this.contactGateway.getSocialLinks();
  protected readonly socialLinks = toSignal(this.socialLinksObservable, {
    initialValue: { linkedin: { url: '', label: '', icon: '' }, github: { url: '', label: '', icon: '' }, email: { url: '', label: '', icon: '' }, phone: { url: '', label: '', icon: '' }, twitter: { url: '', label: '', icon: '' } }
  });
}
