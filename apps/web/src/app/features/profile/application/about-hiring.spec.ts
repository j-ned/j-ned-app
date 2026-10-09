import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { AboutHiring } from './about-hiring';

const CV_DOWNLOAD_URL = '/api/cv/download';

describe('AboutHiring', () => {
  let fixture: ComponentFixture<AboutHiring>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = <T extends HTMLElement = HTMLElement>(testId: string): T | null =>
    host().querySelector<T>(`[data-testid="${testId}"]`);

  const render = async (cvUrl: string | null): Promise<void> => {
    fixture = TestBed.createComponent(AboutHiring);
    fixture.componentRef.setInput('cvUrl', cvUrl);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  describe('Given aucune URL de CV', () => {
    beforeEach(async () => {
      await render(null);
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

  describe('Given l’URL du CV', () => {
    beforeEach(async () => {
      await render(CV_DOWNLOAD_URL);
    });

    it('When le bloc est rendu Then le lien CV pointe sur le téléchargement dans un nouvel onglet', () => {
      const link = byTestId<HTMLAnchorElement>('about-hiring-cv');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe(CV_DOWNLOAD_URL);
      expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('When le visiteur clique le lien CV Then le bloc signale le téléchargement une fois', () => {
      const cvDownloaded = vi.fn();
      fixture.componentInstance.cvDownloaded.subscribe(cvDownloaded);
      const link = byTestId<HTMLAnchorElement>('about-hiring-cv');
      link?.addEventListener('click', (event) => event.preventDefault());

      link?.click();

      expect(cvDownloaded).toHaveBeenCalledOnce();
    });
  });
});
