import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { newTabLabel } from '@shared/identity/new-tab-notice';
import { HOME_RECRUITER_BAND_COPY } from '../domain/home-recruiter-band.static-data';

type ExternalLinkId = 'cv' | 'linkedin' | 'github';

type ExternalLink = {
  readonly id: ExternalLinkId;
  readonly label: string;
  readonly href: string;
};

const PROFILE_LINKS: readonly ExternalLink[] = [
  {
    id: 'linkedin',
    label: HOME_RECRUITER_BAND_COPY.linkedin,
    href: SITE_IDENTITY.socials.linkedin,
  },
  { id: 'github', label: HOME_RECRUITER_BAND_COPY.github, href: SITE_IDENTITY.socials.github },
];

@Component({
  selector: 'app-home-recruiter-band',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <p class="flex flex-wrap items-center gap-x-4 font-mono text-xs text-muted">
      <a
        routerLink="/about"
        fragment="recrutement"
        class="inline-flex min-h-11 items-center font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
        data-testid="home-recruiter-about"
        (click)="hiringOpened.emit()"
        >{{ copy.hiring }}</a
      >
      <span class="inline-flex items-center gap-x-2 whitespace-nowrap">
        @for (link of externalLinks(); track link.id; let first = $first) {
          <span class="inline-flex items-center gap-x-2">
            @if (!first) {
              <span aria-hidden="true">·</span>
            }
            <a
              [href]="link.href"
              target="_blank"
              rel="noopener noreferrer"
              [attr.aria-label]="link.ariaLabel"
              class="inline-flex min-h-11 items-center transition-colors hover:text-primary"
              [attr.data-testid]="'home-recruiter-' + link.id"
              (click)="open(link.id)"
              >{{ link.label }}</a
            >
          </span>
        }
      </span>
    </p>
  `,
})
export class HomeRecruiterBand {
  readonly cvUrl = input.required<string | null>();

  readonly hiringOpened = output<void>();
  readonly cvDownloaded = output<void>();
  readonly linkedinOpened = output<void>();
  readonly githubOpened = output<void>();

  protected readonly copy = HOME_RECRUITER_BAND_COPY;

  protected readonly externalLinks = computed(() => {
    const cvUrl = this.cvUrl();
    const links: readonly ExternalLink[] = cvUrl
      ? [{ id: 'cv', label: HOME_RECRUITER_BAND_COPY.cv, href: cvUrl }, ...PROFILE_LINKS]
      : PROFILE_LINKS;
    return links.map((link) => ({ ...link, ariaLabel: newTabLabel(link.label) }));
  });

  private readonly _outputs = {
    cv: this.cvDownloaded,
    linkedin: this.linkedinOpened,
    github: this.githubOpened,
  } as const satisfies Record<ExternalLinkId, { emit(): void }>;

  protected open(id: ExternalLinkId): void {
    this._outputs[id].emit();
  }
}
