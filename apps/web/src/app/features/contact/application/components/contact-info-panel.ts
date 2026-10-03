import { Component, computed, input } from '@angular/core';
import type { ContactInfo } from '@features/contact/domain/models/contact-info.model';
import type { SocialLinks } from '@features/contact/domain/models/social-link.model';
import { AppIcon } from '@shared/icons/app-icon';

type Channel = {
  readonly key: string;
  readonly value: string;
  readonly href: string | null;
  readonly external: boolean;
};

/** URL affichable : sans protocole, sans `www.`, sans barre finale. */
const toDisplayUrl = (url: string): string =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

// Coordonnées en lignes : libellé mono, valeur lisible, flèche au survol. Toutes les valeurs
// restent visibles en texte (un lien mailto:/tel: peut ne rien ouvrir selon l'appareil).
@Component({
  selector: 'app-contact-info-panel',
  host: { class: 'block' },
  imports: [AppIcon],
  template: `
    <address class="not-italic">
      <ul class="border-t border-foreground/8" role="list">
        @for (channel of channels(); track channel.key) {
          <li class="border-b border-foreground/8" data-testid="contact-channel">
            @if (channel.href) {
              <a
                [href]="channel.href"
                [attr.target]="channel.external ? '_blank' : null"
                [attr.rel]="channel.external ? 'noopener noreferrer' : null"
                class="group grid min-h-14 grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5"
              >
                <span class="font-mono text-xs text-muted">{{ channel.key }}</span>
                <span
                  class="text-[0.96875rem] font-medium break-words transition-colors group-hover:text-primary"
                  >{{ channel.value }}</span
                >
                <app-icon
                  name="arrow-right"
                  [size]="14"
                  class="-rotate-45 text-muted transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary motion-reduce:transition-none"
                />
              </a>
            } @else {
              <p class="grid min-h-14 grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 py-2.5">
                <span class="font-mono text-xs text-muted">{{ channel.key }}</span>
                <span class="text-[0.96875rem] font-medium">{{ channel.value }}</span>
              </p>
            }
          </li>
        }
      </ul>
    </address>
  `,
})
export class ContactInfoPanel {
  readonly contactInfo = input.required<ContactInfo>();
  readonly socialLinks = input.required<SocialLinks>();

  protected readonly channels = computed<readonly Channel[]>(() => {
    const info = this.contactInfo();
    const links = this.socialLinks();
    const web = (key: string, url: string): Channel | null =>
      url ? { key, value: toDisplayUrl(url), href: url, external: true } : null;

    return [
      { key: 'email', value: info.email, href: `mailto:${info.email}`, external: false },
      { key: 'téléphone', value: info.phone, href: links.phone.url || null, external: false },
      web('linkedin', links.linkedin.url),
      web('github', links.github.url),
      web('malt', links.malt.url),
      { key: 'localisation', value: info.location, href: null, external: false },
    ].filter((channel): channel is Channel => channel !== null);
  });
}
