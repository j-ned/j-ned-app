import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { API_BASE_URL } from '@shared/api/api-config';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { AboutHiring } from './about-hiring';

const API = '/api';
const CV_URL = `${API}/cv`;
const CV_DOWNLOAD_URL = `${API}/cv/download`;

describe('AboutHiring', () => {
  let fixture: ComponentFixture<AboutHiring>;
  let http: HttpTestingController;
  const trackCvDownload = vi.fn();

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = <T extends HTMLElement = HTMLElement>(testId: string): T | null =>
    host().querySelector<T>(`[data-testid="${testId}"]`);

  const render = async (): Promise<void> => {
    fixture = TestBed.createComponent(AboutHiring);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    trackCvDownload.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
        { provide: CvGateway, useClass: HttpCvGateway },
        { provide: AnalyticsGateway, useValue: { trackCvDownload } as unknown as AnalyticsGateway },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('Given aucun CV publié', () => {
    beforeEach(async () => {
      await render();
      http.expectOne(CV_URL).flush(null);
      await settle();
    });

    it('When le bloc est rendu Then il est l’ancre recrutement, titré par son unique h2', () => {
      const block = byTestId('about-hiring');
      const headings = block?.querySelectorAll('h2') ?? [];

      expect(block?.id).toBe('recrutement');
      expect(headings).toHaveLength(1);
      expect(headings[0]?.textContent?.trim()).toBe('Vous recrutez\u202F?');
      expect(block?.getAttribute('aria-labelledby')).toBe(headings[0]?.id);
      expect(headings[0]?.id).not.toBe('');
    });

    it('When le bloc est rendu Then il affiche la disponibilité destinée aux recruteurs', () => {
      expect(byTestId('about-hiring-availability')?.textContent?.trim()).toBe(
        SITE_IDENTITY.hiringAvailability,
      );
    });

    it('When le bloc est rendu Then il mène au profil LinkedIn dans un nouvel onglet', () => {
      const link = byTestId<HTMLAnchorElement>('about-hiring-linkedin');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe(SITE_IDENTITY.socials.linkedin);
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')?.split(' ')).toEqual(
        expect.arrayContaining(['noopener', 'noreferrer']),
      );
    });

    it('When le bloc est rendu Then aucun lien CV n’est proposé', () => {
      expect(byTestId('about-hiring-cv')).toBeNull();
    });

    it('When le bloc est rendu Then il n’émet aucun landmark de page', () => {
      expect(host().querySelectorAll('main, header, footer')).toHaveLength(0);
    });
  });

  describe('Given un CV publié', () => {
    beforeEach(async () => {
      await render();
      http.expectOne(CV_URL).flush(makeCvInfo());
      await settle();
    });

    it('When le bloc est rendu Then le lien CV pointe sur le téléchargement dans un nouvel onglet', () => {
      const link = byTestId<HTMLAnchorElement>('about-hiring-cv');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe(CV_DOWNLOAD_URL);
      expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('When le visiteur clique le lien CV Then le téléchargement est mesuré une fois', () => {
      const link = byTestId<HTMLAnchorElement>('about-hiring-cv');
      link?.addEventListener('click', (event) => event.preventDefault());

      link?.click();

      expect(trackCvDownload).toHaveBeenCalledOnce();
    });
  });

  describe('Given le chargement du CV en échec', () => {
    it('When le bloc est rendu Then le lien CV reste absent', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      await render();
      http.expectOne(CV_URL).flush(null, { status: 500, statusText: 'Server Error' });
      await settle();

      expect(byTestId('about-hiring-cv')).toBeNull();
      expect(byTestId('about-hiring-linkedin')).not.toBeNull();
    });
  });
});
