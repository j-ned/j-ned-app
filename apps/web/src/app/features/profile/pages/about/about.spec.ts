import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
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
import { ProfileGateway } from '../../domain/gateways/profile.gateway';
import {
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_BIOGRAPHY,
  STATIC_DIPLOMAS,
  STATIC_MOTIVATION,
  STATIC_PROFILE_BASE,
  STATIC_TECHNOLOGIES,
} from '../../infra/data/profile.static-data';
import { fakeProfileGateway } from '../../testing/fake-profile-gateway';
import { About } from './about';

const API = '/api';

@Component({ template: '' })
class BlankPage {}

type CvAnswer = (request: TestRequest) => void;

const NO_CV: CvAnswer = (request) => request.flush(null);
const PUBLISHED_CV: CvAnswer = (request) => request.flush(makeCvInfo());
const CV_FAILURE: CvAnswer = (request) =>
  request.flush(null, { status: 500, statusText: 'Server Error' });

const PROFILE_READS = [
  'getProfileInfo',
  'getBiography',
  'getSocialButtons',
  'getDiplomas',
  'getTechnologies',
  'getHighlights',
  'getWhatIDo',
  'getMotivation',
] as const satisfies readonly (keyof ProfileGateway)[];

describe('About', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<About>;
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
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'projects', component: BlankPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
        { provide: CvGateway, useClass: HttpCvGateway },
        { provide: AnalyticsGateway, useValue: stubAnalyticsGateway({ trackCvDownload }) },
        { provide: SectionScroller, useValue: { scrollTo, eager: signal(false) } },
        { provide: ProfileGateway, useFactory: fakeProfileGateway },
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('Given le profil livré When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    await render(NO_CV);

    expect(host().querySelector('h1')?.textContent?.trim()).toBe(STATIC_PROFILE_BASE.displayName);
    expect(host().querySelectorAll('main')).toHaveLength(0);
    expect([...host().classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });

  it('Given les sections différées non déclenchées When la page est rendue Then le bloc recrutement est déjà présent sous un h1 unique', async () => {
    await render(NO_CV);

    expect(byTestId('about-hiring')?.id).toBe('recrutement');
    expect(host().querySelectorAll('h1')).toHaveLength(1);
  });

  it.each(PROFILE_READS)(
    'Given la page rendue et ses sections différées affichées Then %s est lu une seule fois',
    async (method) => {
      const read = vi.spyOn(TestBed.inject(ProfileGateway), method);

      await render(NO_CV);
      await completeDeferredSections();

      expect(read).toHaveBeenCalledTimes(1);
    },
  );

  it('Given les sections différées affichées When la page est rendue Then chaque section montre la donnée du profil', async () => {
    await render(NO_CV);
    await completeDeferredSections();

    expect(countOf('journey-paragraph')).toBe(STATIC_BIOGRAPHY.paragraphs.length);
    expect(countOf('about-trait')).toBe(STATIC_ABOUT_HIGHLIGHTS.length);
    expect(countOf('about-tech')).toBe(STATIC_TECHNOLOGIES.length);
    expect(countOf('about-diploma')).toBe(STATIC_DIPLOMAS.length);
    expect(byTestId('motivation-statement')?.textContent?.trim()).toBe(STATIC_MOTIVATION.statement);
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

    it('When la page est rendue Then le haut de page et le bloc recrutement proposent le CV en PDF', () => {
      expect(
        ['about-hero-cv', 'about-hiring-cv'].map((testId) => ({
          href: byTestId(testId)?.getAttribute('href'),
          label: byTestId(testId)?.textContent?.replace(/\s+/g, ' ').trim(),
        })),
      ).toEqual([
        { href: `${API}/cv/download`, label: 'Télécharger mon CV (PDF)' },
        { href: `${API}/cv/download`, label: 'Télécharger mon CV (PDF)' },
      ]);
    });

    it('When la page est rendue Then le lien CV du haut de page vit dans le hero, avant le bloc recrutement', () => {
      const heroCv = byTestId('about-hero-cv');

      expect(heroCv?.closest('app-about-hero')).not.toBeNull();
      expect(
        (heroCv?.compareDocumentPosition(byTestId('about-hiring') as Node) ?? 0) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it.each(['about-hero-cv', 'about-hiring-cv'])(
      'When le visiteur clique %s Then le téléchargement est mesuré une fois',
      (testId) => {
        const link = byTestId<HTMLAnchorElement>(testId);
        link?.addEventListener('click', (event) => event.preventDefault());

        link?.click();

        expect(link).not.toBeNull();
        expect(trackCvDownload).toHaveBeenCalledOnce();
      },
    );
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

      expect([byTestId('about-hero-cv'), byTestId('about-hiring-cv')]).toEqual([null, null]);
      expect(byTestId('about-hiring-linkedin')).not.toBeNull();
    },
  );
});
