import { Component, RESPONSE_INIT, signal } from '@angular/core';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
} from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SectionScroller } from '@core/navigation/section-scroller';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { API_BASE_URL } from '@shared/api/api-config';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { defer, of, throwError } from 'rxjs';
import { ProfileGateway } from '../../domain/gateways/profile.gateway';
import type { ProfileDocument } from '../../domain/models/profile-content.model';
import {
  aDiploma,
  aHighlight,
  aProfileContent,
  aProfileDocument,
  aTechnology,
} from '../../testing/profile-builders';
import { stubProfileGateway } from '../../testing/stub-profile-gateway';
import { About } from './about';

const API = '/api';

@Component({ template: '' })
class BlankPage {}

type CvAnswer = (request: TestRequest) => void;

const NO_CV: CvAnswer = (request) => request.flush(null);
const PUBLISHED_CV: CvAnswer = (request) => request.flush(makeCvInfo());
const CV_FAILURE: CvAnswer = (request) =>
  request.flush(null, { status: 500, statusText: 'Server Error' });

const PORTRAIT_URL = '/api/storage/portfolio-storage/profile/portrait-1a2b3c4d.avif';

const DOCUMENT: ProfileDocument = aProfileDocument({
  content: aProfileContent({
    biography: {
      title: 'Parcours témoin',
      summary: 'Résumé du parcours témoin.',
      leadEmphasis: 'Suite de l’accroche témoin.',
      paragraphs: ['Paragraphe A.', 'Paragraphe B.', 'Paragraphe C.'],
    },
    highlights: [aHighlight({ id: 'h1' }), aHighlight({ id: 'h2' })],
    technologies: [aTechnology({ id: 't1' }), aTechnology({ id: 't2' }), aTechnology({ id: 't3' })],
    diplomas: [aDiploma({ id: 'd1' })],
    workSummary: 'Résumé des activités témoin.',
    diplomasSummary: 'Résumé des formations témoin.',
  }),
});

describe('About', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<About>;
  let responseInit: ResponseInit;
  const scrollTo = vi.fn();
  const trackCvDownload = vi.fn();

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = <T extends HTMLElement = HTMLElement>(testId: string): T | null =>
    host().querySelector<T>(`[data-testid="${testId}"]`);
  const countOf = (testId: string): number =>
    host().querySelectorAll(`[data-testid="${testId}"]`).length;

  const render = async (answerCv: CvAnswer): Promise<void> => {
    fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    await fixture.whenStable();
    answerCv(http.expectOne(`${API}/cv`));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const completeDeferredSections = async (): Promise<void> => {
    for (const block of await fixture.getDeferBlocks()) {
      await block.render(DeferBlockState.Complete);
    }
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    scrollTo.mockClear();
    trackCvDownload.mockClear();
    responseInit = { status: 200 };
    TestBed.configureTestingModule({
      providers: [
        { provide: RESPONSE_INIT, useValue: responseInit },
        provideRouter([{ path: 'projects', component: BlankPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
        { provide: CvGateway, useClass: HttpCvGateway },
        { provide: AnalyticsGateway, useValue: stubAnalyticsGateway({ trackCvDownload }) },
        { provide: SectionScroller, useValue: { scrollTo, eager: signal(false) } },
        {
          provide: ProfileGateway,
          useValue: stubProfileGateway({ getProfile: () => defer(() => of(DOCUMENT)) }),
        },
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  const serveDocument = (document: ProfileDocument): void => {
    vi.spyOn(TestBed.inject(ProfileGateway), 'getProfile').mockReturnValue(
      defer(() => of(document)),
    );
  };
  const textOf = (element: Element | null | undefined): string | undefined =>
    element?.textContent?.replace(/\s+/g, ' ').trim();
  const summaryOf = (headingId: string): string | undefined =>
    textOf(
      host().querySelector(
        `section[aria-labelledby="${headingId}"] [data-testid="split-section-summary"]`,
      ),
    );

  it('Given le parcours livré When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    await render(NO_CV);

    expect(host().querySelector('h1')?.textContent?.trim()).toBe('Julien Nédellec');
    expect(host().querySelectorAll('main')).toHaveLength(0);
    expect([...host().classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });

  it('Given les sections différées non déclenchées When la page est rendue Then seul le haut de page est rendu, sous un h1 unique, les autres sections attendant derrière leur place réservée', async () => {
    await render(NO_CV);

    expect(Array.from(host().children, (child) => child.tagName.toLowerCase())).toEqual([
      'app-about-hero',
      'div',
      'div',
      'div',
      'div',
      'div',
    ]);
    expect(host().querySelectorAll('h1')).toHaveLength(1);
  });

  it('Given la page rendue et ses sections différées affichées Then le parcours est lu une seule fois', async () => {
    const read = vi.spyOn(TestBed.inject(ProfileGateway), 'getProfile');

    await render(NO_CV);
    await completeDeferredSections();

    expect(read).toHaveBeenCalledTimes(1);
  });

  it('Given les sections différées affichées When la page est rendue Then chaque section montre le contenu du document', async () => {
    await render(NO_CV);
    await completeDeferredSections();

    expect(summaryOf('journey-heading')).toBe('Résumé du parcours témoin.');
    expect(
      Array.from(host().querySelectorAll('[data-testid="journey-paragraph"]'), textOf),
    ).toEqual(['Paragraphe A.', 'Paragraphe B.', 'Paragraphe C.']);
    expect(countOf('about-trait')).toBe(2);
    expect(countOf('about-tech')).toBe(3);
    expect(countOf('about-diploma')).toBe(1);
    expect(byTestId('motivation-statement')?.textContent?.trim()).toBe(
      DOCUMENT.content.motivation.statement,
    );
  });

  it('Given les sections différées affichées When la page est rendue Then les résumés des activités et des formations viennent du document', async () => {
    await render(NO_CV);
    await completeDeferredSections();

    expect([summaryOf('work-heading'), summaryOf('diploma-heading')]).toEqual([
      'Résumé des activités témoin.',
      'Résumé des formations témoin.',
    ]);
  });

  it('Given le parcours livré When la page est rendue Then l’accroche dit la phrase d’identité une seule fois, suivie de la suite du document', async () => {
    await render(NO_CV);
    const lead = textOf(byTestId('about-lead')) ?? '';

    expect(lead).toBe(`${SITE_IDENTITY.journey} Suite de l’accroche témoin.`);
    expect(lead.split(SITE_IDENTITY.journey)).toHaveLength(2);
  });

  it('Given le parcours livré When la page est rendue Then rôle, stack et ville du premier écran restent ceux du site', async () => {
    await render(NO_CV);

    expect(Array.from(host().querySelectorAll('[data-testid="about-hero-fact"]'), textOf)).toEqual([
      'développeur full-stack',
      'Angular · NestJS · TypeScript',
      SITE_IDENTITY.location,
    ]);
  });

  it('Given le parcours livré When la page est rendue Then les réseaux du site suivent GitHub, LinkedIn, Malt, Mail puis Discord', async () => {
    await render(NO_CV);

    expect(
      Array.from(
        host().querySelectorAll<HTMLAnchorElement>('[data-testid="about-social-link"]'),
        (link) => ({ label: textOf(link), href: link.getAttribute('href') }),
      ),
    ).toEqual([
      { label: 'GitHub', href: SITE_IDENTITY.socials.github },
      { label: 'LinkedIn', href: SITE_IDENTITY.socials.linkedin },
      { label: 'Malt', href: SITE_IDENTITY.socials.malt },
      { label: 'Mail', href: `mailto:${SITE_IDENTITY.email}` },
      { label: 'Discord', href: SITE_IDENTITY.socials.discord },
    ]);
  });

  it.each([
    { cas: 'un portrait défini', portraitUrl: PORTRAIT_URL, src: PORTRAIT_URL },
    { cas: 'aucun portrait', portraitUrl: null, src: '/avatar.avif' },
  ])(
    'Given $cas When la page est rendue Then le portrait affiché est $src, au texte alternatif fixe',
    async ({ portraitUrl, src }) => {
      serveDocument({ ...DOCUMENT, portraitUrl });

      await render(NO_CV);
      const portrait = host().querySelector('[data-testid="about-portrait"] img');

      expect([portrait?.getAttribute('src'), portrait?.getAttribute('alt')]).toEqual([
        src,
        'Portrait de Julien Nédellec',
      ]);
    },
  );

  it('Given la lecture du parcours en échec When la page est rendue Then aucun contenu de repli n’est affiché', async () => {
    const read = vi
      .spyOn(TestBed.inject(ProfileGateway), 'getProfile')
      .mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' })),
      );

    await render(NO_CV);
    await completeDeferredSections();

    expect(read).toHaveBeenCalledOnce();
    expect([
      host().querySelectorAll('h1').length,
      countOf('about-lead'),
      countOf('journey-paragraph'),
      countOf('about-trait'),
      countOf('motivation-statement'),
    ]).toEqual([0, 0, 0, 0, 0]);
  });

  it.each([
    { status: 404, statusText: 'Not Found' },
    { status: 503, statusText: 'Service Unavailable' },
  ])(
    'Given le rendu serveur et la lecture du parcours en $status When la page est rendue Then la réponse est 503, jamais une page vide en 200 ni un 404',
    async ({ status, statusText }) => {
      vi.spyOn(TestBed.inject(ProfileGateway), 'getProfile').mockReturnValue(
        throwError(() => new HttpErrorResponse({ status, statusText })),
      );

      await render(NO_CV);

      expect(responseInit.status).toBe(503);
    },
  );

  it('Given le rendu serveur et le parcours lu When la page est rendue Then le statut de la réponse reste 200', async () => {
    await render(NO_CV);

    expect(responseInit.status).toBe(200);
  });

  describe('Given la conclusion affichée', () => {
    beforeEach(async () => {
      await render(NO_CV);
      await completeDeferredSections();
    });

    it('When le visiteur clique « Voir les projets » Then la page part vers /projects', async () => {
      byTestId('about-cta-projects')?.click();
      await fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/projects');
    });

    it('When le visiteur clique « Me contacter » Then la page cible la section contact', () => {
      byTestId<HTMLButtonElement>('about-cta-contact')?.click();

      expect(scrollTo).toHaveBeenCalledExactlyOnceWith('contact');
    });
  });

  describe('Given un CV publié', () => {
    beforeEach(async () => {
      await render(PUBLISHED_CV);
    });

    it('When la page est rendue Then le haut de page propose le CV en PDF', () => {
      const heroCv = byTestId('about-hero-cv');

      expect({
        href: heroCv?.getAttribute('href'),
        label: heroCv?.textContent?.replace(/\s+/g, ' ').trim(),
      }).toEqual({ href: `${API}/cv/download`, label: 'Télécharger mon CV (PDF)' });
    });

    it('When la page est rendue Then le seul lien CV de la page vit dans le haut de page', () => {
      const cvLinks = Array.from(host().querySelectorAll(`a[href="${API}/cv/download"]`));

      expect(cvLinks.map((link) => link.closest('app-about-hero') !== null)).toEqual([true]);
    });

    it('When le visiteur clique le CV du haut de page Then le téléchargement est mesuré une fois', () => {
      const link = byTestId<HTMLAnchorElement>('about-hero-cv');
      link?.addEventListener('click', (event) => event.preventDefault());

      link?.click();

      expect(link).not.toBeNull();
      expect(trackCvDownload).toHaveBeenCalledOnce();
    });
  });

  describe('Given le prérendu, où aucun rendu navigateur n’a lieu', () => {
    const serverGlobals = globalThis as { ngServerMode?: boolean };

    beforeEach(() => {
      serverGlobals.ngServerMode = true;
    });

    afterEach(() => {
      delete serverGlobals.ngServerMode;
    });

    it('When la page est prérendue avec un CV publié Then le CV est lu sans attendre le navigateur et le lien du haut de page est dans le HTML', async () => {
      fixture = TestBed.createComponent(About);
      fixture.detectChanges();
      await fixture.whenStable();
      const requests = http.match(`${API}/cv`);

      expect(requests).toHaveLength(1);
      requests[0]?.flush(makeCvInfo());
      await fixture.whenStable();
      fixture.detectChanges();

      expect(byTestId('about-hero-cv')?.getAttribute('href')).toBe(`${API}/cv/download`);
    });
  });

  it.each<{ label: string; answer: CvAnswer }>([
    { label: 'aucun CV publié', answer: NO_CV },
    { label: 'le chargement du CV en échec', answer: CV_FAILURE },
  ])(
    'Given $label When la page est rendue Then aucun lien CV n’est proposé et LinkedIn reste proposé',
    async ({ answer }) => {
      await render(answer);

      expect(host().querySelectorAll(`a[href="${API}/cv/download"]`)).toHaveLength(0);
      expect(
        Array.from(
          host().querySelectorAll<HTMLAnchorElement>('[data-testid="about-social-link"]'),
          (link) => link.getAttribute('href'),
        ),
      ).toContain(SITE_IDENTITY.socials.linkedin);
    },
  );
});
