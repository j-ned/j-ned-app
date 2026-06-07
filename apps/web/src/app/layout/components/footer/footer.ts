import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionScroller } from '@core/navigation/section-scroller';
import { AppIcon } from '@shared/icons';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

type SocialItem = {
  readonly label: string;
  readonly url: string;
  readonly icon: string;
};

const SOCIALS: readonly SocialItem[] = [
  { label: 'GitHub', url: SITE_IDENTITY.socials.github, icon: 'lucide-github' },
  { label: 'LinkedIn', url: SITE_IDENTITY.socials.linkedin, icon: 'lucide-linkedin' },
  { label: 'X (Twitter)', url: SITE_IDENTITY.socials.x, icon: 'bi-twitter-x' },
  { label: 'Email', url: `mailto:${SITE_IDENTITY.email}`, icon: 'lucide-mail' },
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

      <button
        type="button"
        (click)="scrollToContact()"
        class="group inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors"
      >
        <app-icon
          name="lucide-mail"
          [size]="16"
          class="text-muted group-hover:text-primary transition-colors"
        />
        Me contacter
      </button>

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
  private readonly scroller = inject(SectionScroller);

  protected readonly socials = SOCIALS;
  protected readonly currentYear = new Date().getFullYear();

  protected scrollToContact(): void {
    this.scroller.scrollTo('contact');
  }
}
