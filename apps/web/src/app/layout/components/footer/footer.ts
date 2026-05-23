import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons';

type SocialItem = {
  readonly label: string;
  readonly url: string;
  readonly icon: string;
};

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
  imports: [RouterLink, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-t border-nav-border bg-surface' },
  template: `
    <footer
      class="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <a
        routerLink="/"
        class="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        <app-icon name="code" [size]="16" class="text-primary" />
        Julien<span class="text-primary"> N.</span>
        <span class="text-muted font-normal">&copy; {{ currentYear }}</span>
      </a>

      <nav class="flex items-center gap-2" aria-label="Réseaux sociaux">
        @for (social of socials; track social.label) {
          <a
            [href]="social.url"
            [attr.aria-label]="social.label"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center w-11 h-11 rounded-lg text-muted hover:text-primary hover:bg-foreground/5 transition-colors"
          >
            <app-icon [name]="social.icon" [size]="18" />
          </a>
        }
      </nav>
    </footer>
  `,
})
export class Footer {
  protected readonly socials = SOCIALS;
  protected readonly currentYear = new Date().getFullYear();
}
