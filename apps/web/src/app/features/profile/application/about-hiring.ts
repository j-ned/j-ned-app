import { Component, input, output } from '@angular/core';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';

@Component({
  selector: 'app-about-hiring',
  imports: [AppIcon, Button],
  host: { class: 'block border-t border-foreground/8' },
  template: `
    <section
      id="recrutement"
      class="page-container scroll-mt-20 py-26 md:py-34"
      aria-labelledby="hiring-heading"
      data-testid="about-hiring"
    >
      <h2 id="hiring-heading" class="font-mono text-[0.8125rem] font-medium text-muted">
        Vous recrutez&#8239;?
      </h2>
      <p
        class="mt-4 max-w-[36ch] text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.02em] text-balance"
        data-testid="about-hiring-availability"
      >
        {{ hiringAvailability }}
      </p>
      <div class="mt-9 flex flex-wrap gap-3">
        <a
          appButton
          variant="outlined"
          [href]="linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="about-hiring-linkedin"
        >
          <app-icon name="linkedin" />
          Profil LinkedIn
        </a>
        @if (cvUrl(); as url) {
          <a
            appButton
            variant="outlined"
            [href]="url"
            target="_blank"
            rel="noopener noreferrer"
            (click)="cvDownloaded.emit()"
            data-testid="about-hiring-cv"
          >
            <app-icon name="download" />
            Télécharger mon CV
          </a>
        }
      </div>
    </section>
  `,
})
export class AboutHiring {
  readonly cvUrl = input.required<string | null>();

  readonly cvDownloaded = output<void>();

  protected readonly hiringAvailability = SITE_IDENTITY.hiringAvailability;
  protected readonly linkedinUrl = SITE_IDENTITY.socials.linkedin;
}
