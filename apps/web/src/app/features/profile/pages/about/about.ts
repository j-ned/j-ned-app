import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { injectMarkUnavailable } from '@core/ssr/response-status';
import { SectionScroller } from '@core/navigation/section-scroller';
import { CvDownload } from '@features/cv/application/cv-download';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { ProfileGateway } from '../../domain/gateways/profile.gateway';
import { AboutHero } from '../../application/about-hero';
import { AboutDiploma } from '../../application/about-diploma';
import { AboutJourney } from '../../application/about-journey';
import { AboutWhatIDo } from '../../application/about-what-i-do';
import { AboutHighlights } from '../../application/about-highlights';
import { AboutMotivation } from '../../application/about-motivation';
import { AboutHiring } from '../../application/about-hiring';
import { ABOUT_IDENTITY, DEFAULT_PORTRAIT_URL } from './about-identity';

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
      [profile]="profile()"
      [lead]="journey"
      [biography]="about?.biography"
      [socials]="socials"
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
        [summary]="about?.workSummary ?? ''"
      />
    } @placeholder {
      <div class="h-[36rem] border-t border-foreground/8" aria-hidden="true"></div>
    } @error {
      <p class="page-container py-12 text-sm text-muted">Section indisponible.</p>
    }

    @defer (hydrate on viewport) {
      <app-about-diploma
        [diplomas]="about?.diplomas ?? []"
        [summary]="about?.diplomasSummary ?? ''"
      />
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
  private readonly _markUnavailable = injectMarkUnavailable();

  private readonly _profileResource = rxResource({
    // La page existe toujours : une lecture en échec, 404 compris, ne doit être ni un 200 vide ni un 404.
    stream: () =>
      this._profileGateway.getProfile().pipe(tap({ error: () => this._markUnavailable() })),
  });
  // `value()` lève sur une ressource en erreur ; `hasValue()` non.
  private readonly _document = computed(() =>
    this._profileResource.hasValue() ? this._profileResource.value() : undefined,
  );
  protected readonly content = computed(() => this._document()?.content);
  protected readonly profile = computed(() => {
    const document = this._document();
    return document
      ? { ...ABOUT_IDENTITY.profile, avatarUrl: document.portraitUrl ?? DEFAULT_PORTRAIT_URL }
      : undefined;
  });
  protected readonly journey = SITE_IDENTITY.journey;
  protected readonly socials = ABOUT_IDENTITY.socials;
  protected readonly cvUrl = this._cvDownload.url;

  protected goToContact(): void {
    this._scroller.scrollTo('contact');
  }

  protected trackCvDownload(): void {
    this._cvDownload.track();
  }
}
