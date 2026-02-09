import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

type FooterLink = {
  readonly label: string;
  readonly href: string;
};

type SocialItem = {
  readonly label: string;
  readonly url: string;
  readonly icon: string;
};

const NAV_COLUMNS: readonly { title: string; links: readonly FooterLink[] }[] = [
  {
    title: 'Navigation',
    links: [
      { label: 'Accueil', href: '/' },
      { label: 'Projets', href: '/projects' },
      { label: 'À propos', href: '/about' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Réservation', href: '/booking' },
    ],
  },
];

const SOCIALS: readonly SocialItem[] = [
  { label: 'GitHub', url: 'https://github.com/djoudj-dev', icon: 'lucide-github' },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/nedellec-julien/',
    icon: 'lucide-linkedin',
  },
  { label: 'X (Twitter)', url: 'https://x.com/djoudj_78', icon: 'bi-twitter-x' },
  { label: 'Email', url: 'mailto:contact@nedellec-julien.fr', icon: 'lucide-mail' },
];

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-t border-white/5 bg-background/80 backdrop-blur-md' },
  template: `
    <footer class="max-w-7xl mx-auto px-6 py-16">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
        <div class="md:col-span-5">
          <a
            routerLink="/"
            class="inline-flex items-center gap-3 text-2xl font-display font-bold text-primary mb-4"
          >
            <div
              class="p-2 bg-linear-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30"
            >
              <svg class="w-6 h-6">
                <use href="/icons/sprite.svg#lucide-code-xml"></use>
              </svg>
            </div>
            Julien<span class="text-primary">.N</span>
          </a>
          <p class="text-sm text-muted leading-relaxed max-w-sm mt-3">
            Développeur full-stack spécialisé Angular & NestJS. Architecture propre, code
            maintenable et infrastructure maîtrisée de bout en bout.
          </p>
          <nav class="flex items-center gap-3 mt-6" aria-label="Réseaux sociaux">
            @for (social of socials; track social.label) {
              <a
                [href]="social.url"
                [attr.aria-label]="social.label"
                target="_blank"
                rel="noopener noreferrer"
                class="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/10 text-muted hover:text-primary transition-all duration-300"
              >
                <svg class="w-5 h-5" aria-hidden="true">
                  <use [attr.href]="'/icons/sprite.svg#' + social.icon" />
                </svg>
              </a>
            }
          </nav>
        </div>
        @for (column of navColumns; track column.title) {
          <nav class="md:col-span-2">
            <h3 class="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              {{ column.title }}
            </h3>
            <ul class="space-y-3">
              @for (link of column.links; track link.href) {
                <li>
                  <a
                    [routerLink]="link.href"
                    class="text-sm text-muted hover:text-primary transition-colors duration-200"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </nav>
        }
        <address class="md:col-span-3 not-italic">
          <h3 class="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Contact
          </h3>
          <ul class="space-y-3">
            <li>
              <a
                href="mailto:contact@nedellec-julien.fr"
                class="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors duration-200"
              >
                <svg class="w-4 h-4 shrink-0" aria-hidden="true">
                  <use href="/icons/sprite.svg#lucide-mail" />
                </svg>
                contact&#64;nedellec-julien.fr
              </a>
            </li>
            <li>
              <p class="flex items-center gap-2 text-sm text-muted">
                <svg class="w-4 h-4 shrink-0" aria-hidden="true">
                  <use href="/icons/sprite.svg#lucide-map-pin" />
                </svg>
                Voisins-Le-Bretonneux, France
              </p>
            </li>
          </ul>
        </address>
      </div>
      <div
        class="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <p class="text-xs text-muted">
          &copy; {{ currentYear }} Julien Nedellec. Tous droits réservés.
        </p>
        <p class="text-xs text-muted flex items-center gap-1.5">
          Fait avec beaucoup de
          <svg class="w-6 h-6 text-primary" aria-hidden="true">
            <use href="/icons/sprite.svg#lucide-code-xml" />
          </svg>
          et de
          <svg class="w-6 h-6 text-red-600" aria-hidden="true">
            <use href="/icons/sprite.svg#material-symbols-heart-smile" />
          </svg>
        </p>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly navColumns = NAV_COLUMNS;
  protected readonly socials = SOCIALS;
  protected readonly currentYear = new Date().getFullYear();
}
