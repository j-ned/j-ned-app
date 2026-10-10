import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { SectionScroller } from '@core/navigation/section-scroller';
import { CvDownload } from '@features/cv/application/cv-download';
import { ProfileGateway } from '../../domain/gateways/profile.gateway';
import { AboutHero } from '../../application/about-hero';
import { AboutDiploma } from '../../application/about-diploma';
import { AboutJourney } from '../../application/about-journey';
import { AboutWhatIDo } from '../../application/about-what-i-do';
import { AboutHighlights } from '../../application/about-highlights';
import { AboutMotivation } from '../../application/about-motivation';
import { AboutHiring } from '../../application/about-hiring';

// Le bloc recrutement reste hors @defer : l'ancre #recrutement doit exister au premier rendu.
@Component({
  selector: 'app-about',
  host: { class: 'block min-h-svh pt-20' },
  providers: [CvDownload],
  imports: [
    AboutHero,
    AboutJourney,
    AboutHighlights,
    AboutWhatIDo,
    AboutDiploma,
    AboutHiring,
    AboutMotivation,
  ],
  template: `
    @let about = content();
    <app-about-hero
      [profile]="about?.profile"
      [biography]="about?.biography"
      [socials]="about?.socials ?? []"
      [cvUrl]="cvUrl()"
      (cvDownloaded)="trackCvDownload()"
    />

    @defer (hydrate on viewport) {
      <app-about-journey [biography]="about?.biography" />
    } @placeholder {
      <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }

    @defer (hydrate on viewport) {
      <app-about-highlights [highlights]="about?.highlights ?? []" />
    } @placeholder {
      <div class="h-[28rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }

    @defer (hydrate on viewport) {
      <app-about-what-i-do
        [whatIDo]="about?.whatIDo ?? []"
        [technologies]="about?.technologies ?? []"
      />
    } @placeholder {
      <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }

    @defer (hydrate on viewport) {
      <app-about-diploma [diplomas]="about?.diplomas ?? []" />
    } @placeholder {
      <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }

    <app-about-hiring [cvUrl]="cvUrl()" (cvDownloaded)="trackCvDownload()" />

    @defer (hydrate on viewport) {
      <app-about-motivation [motivation]="about?.motivation" (contactRequested)="goToContact()" />
    } @placeholder {
      <div class="h-[30rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }
  `,
})
export class About {
  private readonly _profileGateway = inject(ProfileGateway);
  private readonly _cvDownload = inject(CvDownload);
  private readonly _scroller = inject(SectionScroller);

  private readonly _contentResource = rxResource({
    stream: () =>
      forkJoin({
        profile: this._profileGateway.getProfileInfo(),
        biography: this._profileGateway.getBiography(),
        socials: this._profileGateway.getSocialButtons(),
        diplomas: this._profileGateway.getDiplomas(),
        technologies: this._profileGateway.getTechnologies(),
        highlights: this._profileGateway.getHighlights(),
        whatIDo: this._profileGateway.getWhatIDo(),
        motivation: this._profileGateway.getMotivation(),
      }),
  });
  // `value()` lève sur une ressource en erreur ; `hasValue()` non.
  protected readonly content = computed(() =>
    this._contentResource.hasValue() ? this._contentResource.value() : undefined,
  );
  protected readonly cvUrl = this._cvDownload.url;

  protected goToContact(): void {
    this._scroller.scrollTo('contact');
  }

  protected trackCvDownload(): void {
    this._cvDownload.track();
  }
}
