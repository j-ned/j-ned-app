import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { Header } from './header';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { ActiveSection } from '@core/navigation/active-section';
import type { CvInfo } from '@features/cv/domain/models/cv.model';

const THEME_STORAGE_KEY = 'j-ned:theme';

const cvInfo = (overrides: Partial<CvInfo> = {}): CvInfo => ({
  id: 'cv-1',
  fileName: 'cv.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  uploadedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

function makeAnalyticsGateway(overrides: Partial<AnalyticsGateway> = {}): AnalyticsGateway {
  return {
    trackCvDownload: vi.fn(),
    getActiveVisitors: () => EMPTY,
    ...overrides,
  } as unknown as AnalyticsGateway;
}

function makeCvGateway(overrides: Partial<CvGateway> = {}): CvGateway {
  return {
    getCurrent: () => of(null),
    getDownloadUrl: () => 'https://cdn.example/cv.pdf',
    upload: () => EMPTY,
    delete: () => EMPTY,
    ...overrides,
  } as unknown as CvGateway;
}

type SectionScrollerStub = {
  scrollTo: ReturnType<typeof vi.fn>;
  scrollToTop: ReturnType<typeof vi.fn>;
};

function makeScroller(): SectionScrollerStub {
  return { scrollTo: vi.fn(), scrollToTop: vi.fn() };
}

async function setup(
  options: {
    analytics?: AnalyticsGateway;
    cv?: CvGateway;
    scroller?: SectionScrollerStub;
    activeKey?: string | null;
  } = {},
): Promise<{
  component: Header;
  fixture: ReturnType<typeof TestBed.createComponent<Header>>;
  scroller: SectionScrollerStub;
  analytics: AnalyticsGateway;
}> {
  const analytics = options.analytics ?? makeAnalyticsGateway();
  const cv = options.cv ?? makeCvGateway();
  const scroller = options.scroller ?? makeScroller();
  const active = new ActiveSection();
  if (options.activeKey) active.set(options.activeKey);

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AnalyticsGateway, useValue: analytics },
      { provide: CvGateway, useValue: cv },
      { provide: SectionScroller, useValue: scroller },
      { provide: ActiveSection, useValue: active },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });

  const fixture = TestBed.createComponent(Header);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture, scroller, analytics };
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  describe('liens de navigation', () => {
    it('rend un lien route (<a routerLink>) et un bouton de section', async () => {
      const { fixture } = await setup();
      const anchors = fixture.nativeElement.querySelectorAll('nav a[href]');
      const sectionButtons = fixture.nativeElement.querySelectorAll('nav button[type="button"]');

      const labels = Array.from(anchors).map((a) => (a as HTMLElement).textContent?.trim());
      expect(labels.some((l) => l?.includes('Projets'))).toBe(true);
      expect(labels.some((l) => l?.includes('À propos'))).toBe(true);
      expect(sectionButtons.length).toBeGreaterThan(0);
    });

    it('délègue le scroll vers la section au SectionScroller au clic du bouton', async () => {
      const { fixture, scroller } = await setup();
      const button = fixture.nativeElement.querySelector(
        'nav button[type="button"]',
      ) as HTMLButtonElement;
      button.click();
      expect(scroller.scrollTo).toHaveBeenCalledWith('contact');
    });

    it('délègue scrollToTop au clic sur le logo', async () => {
      const { component, scroller } = await setup();
      component['scrollToTop']();
      expect(scroller.scrollToTop).toHaveBeenCalledOnce();
    });

    it('reflète la section active fournie par ActiveSection', async () => {
      const { component } = await setup({ activeKey: 'contact' });
      expect(component['activeKey']()).toBe('contact');
    });
  });

  describe('toggle de thème', () => {
    it('inverse isDarkTheme et persiste la préférence dans localStorage', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const { component, fixture } = await setup();
      expect(component['isDarkTheme']()).toBe(true);

      component['toggleTheme']();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component['isDarkTheme']()).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });

    it('applique la classe app-dark sur <html> en thème sombre, la retire en clair', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const { component, fixture } = await setup();
      expect(document.documentElement.classList.contains('app-dark')).toBe(true);

      component['toggleTheme']();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.documentElement.classList.contains('app-dark')).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });
  });

  describe('menu mobile (drawer)', () => {
    it('démarre fermé', async () => {
      const { component } = await setup();
      expect(component['isMobileMenuOpen']()).toBe(false);
    });

    it('toggleMobileMenu ouvre puis ferme le drawer', async () => {
      const { component } = await setup();
      component['toggleMobileMenu']();
      expect(component['isMobileMenuOpen']()).toBe(true);
      component['toggleMobileMenu']();
      expect(component['isMobileMenuOpen']()).toBe(false);
    });

    it('closeMobileMenu force la fermeture', async () => {
      const { component } = await setup();
      component['isMobileMenuOpen'].set(true);
      component['closeMobileMenu']();
      expect(component['isMobileMenuOpen']()).toBe(false);
    });
  });

  describe('lien CV conditionnel', () => {
    it('masque le lien CV quand aucun CV n’est disponible', async () => {
      const { component, fixture } = await setup({
        cv: makeCvGateway({ getCurrent: () => of(null) }),
      });
      expect(component['cvUrl']()).toBeNull();
      const cvLinks = fixture.nativeElement.querySelectorAll('a[href][target="_blank"]');
      expect(cvLinks.length).toBe(0);
    });

    it('expose l’URL de téléchargement quand un CV existe', async () => {
      const { component } = await setup({
        cv: makeCvGateway({
          getCurrent: () => of(cvInfo()),
          getDownloadUrl: () => 'https://cdn.example/cv.pdf',
        }),
      });
      expect(component['cvUrl']()).toBe('https://cdn.example/cv.pdf');
    });

    it('garde le lien masqué si le chargement du CV échoue', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { component } = await setup({
        cv: makeCvGateway({ getCurrent: () => throwError(() => new Error('boom')) }),
      });
      expect(component['cvUrl']()).toBeNull();
      warn.mockRestore();
    });

    it('trackCvDownload délègue à AnalyticsGateway', async () => {
      const { component, analytics } = await setup();
      component['trackCvDownload']();
      expect(analytics.trackCvDownload).toHaveBeenCalledOnce();
    });
  });
});
