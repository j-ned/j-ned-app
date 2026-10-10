import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { Header } from './header';
import { NAV_LINKS } from './nav-items';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { ActiveSection } from '@core/navigation/active-section';
import type { CvInfo } from '@features/cv/domain/models/cv.model';
import { ThemeStore } from '@core/theme/theme-store';
import { installSystemColorScheme } from '@core/theme/testing/system-color-scheme';

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
    trackCtaClick: vi.fn(),
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
  scrollToRequestForm: ReturnType<typeof vi.fn>;
};

function makeScroller(): SectionScrollerStub {
  return { scrollTo: vi.fn(), scrollToTop: vi.fn(), scrollToRequestForm: vi.fn() };
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
    it('ordonne le menu principal : Offres, Réalisations, Méthode, Blog, Parcours', () => {
      expect(
        NAV_LINKS.map((item) => ({
          kind: item.kind,
          label: item.label,
          target: item.kind === 'route' ? item.href : item.sectionId,
        })),
      ).toEqual([
        { kind: 'route', label: 'Offres', target: '/offres' },
        { kind: 'route', label: 'Réalisations', target: '/projects' },
        { kind: 'section', label: 'Méthode', target: 'methode' },
        { kind: 'route', label: 'Blog', target: '/blog' },
        { kind: 'route', label: 'Parcours', target: '/about' },
      ]);
    });

    it('rend un lien route (<a routerLink>) et un bouton de section', async () => {
      const { fixture } = await setup();
      const anchors = fixture.nativeElement.querySelectorAll('nav a[href]');
      const sectionButtons = fixture.nativeElement.querySelectorAll('nav button[type="button"]');

      const labels = Array.from(anchors).map((a) => (a as HTMLElement).textContent?.trim());
      expect(labels.some((l) => l?.includes('Réalisations'))).toBe(true);
      expect(labels.some((l) => l?.includes('Parcours'))).toBe(true);
      expect(sectionButtons.length).toBeGreaterThan(0);
    });

    it('dessert toutes les destinations de NAV_LINKS', async () => {
      const { fixture } = await setup();
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
      const anchors = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href]'));
      const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>('button[type="button"]'));

      for (const item of NAV_LINKS) {
        const target =
          item.kind === 'route'
            ? anchors.find((a) => a.getAttribute('href') === item.href)
            : buttons.find((b) => b.textContent?.includes(item.label));
        expect(target, `destination manquante dans la nav : ${item.label}`).toBeTruthy();
        expect(target?.textContent).toContain(item.label);
      }
    });

    it('délègue le scroll vers la section méthode au SectionScroller au clic du bouton', async () => {
      const { fixture, scroller } = await setup();
      const button = fixture.nativeElement.querySelector(
        'nav button[type="button"]',
      ) as HTMLButtonElement;
      button.click();
      expect(scroller.scrollTo).toHaveBeenCalledExactlyOnceWith('methode');
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

  describe('bouton d’appel « Décrire mon projet »', () => {
    const ctasIn = (root: HTMLElement): HTMLElement[] =>
      Array.from(root.querySelectorAll<HTMLElement>('[data-testid="header-cta"]'));

    const nativeButtonOf = (cta: HTMLElement | undefined): HTMLButtonElement | null =>
      cta instanceof HTMLButtonElement ? cta : (cta?.querySelector('button') ?? null);

    const openDrawer = async (
      component: Header,
      fixture: ReturnType<typeof TestBed.createComponent<Header>>,
    ): Promise<void> => {
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
    };

    it('Given l’en-tête When il est rendu Then un seul bouton d’appel vit dans le header, hors de toute nav', async () => {
      const { fixture } = await setup();
      const host = fixture.nativeElement as HTMLElement;
      const ctas = ctasIn(host);
      const header = host.querySelector('header') as HTMLElement;

      const button = nativeButtonOf(ctas[0]);

      expect(ctas).toHaveLength(1);
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button?.getAttribute('type')).toBe('button');
      expect(button?.textContent?.trim()).toBe('Décrire mon projet');
      expect(header.contains(ctas[0] ?? null)).toBe(true);
      expect(ctas[0]?.closest('nav')).toBeNull();
    });

    it('Given le menu mobile ouvert When il est rendu Then le bouton d’appel reste unique, dans la barre et hors du drawer', async () => {
      const { component, fixture } = await setup();
      await openDrawer(component, fixture);
      const host = fixture.nativeElement as HTMLElement;
      const ctas = ctasIn(host);

      expect(host.querySelector('[role="dialog"]')).not.toBeNull();
      expect(ctas).toHaveLength(1);
      expect(ctas[0]?.closest('app-drawer')).toBeNull();
      expect(ctas[0]?.closest('header')).not.toBeNull();
    });

    it('Given le bouton d’appel When on remonte jusqu’au header Then aucun ancêtre ne le masque à une largeur donnée', async () => {
      const { fixture } = await setup();
      const host = fixture.nativeElement as HTMLElement;
      const header = host.querySelector('header') as HTMLElement;
      const hidingTokens: string[] = [];
      let el: HTMLElement | null = ctasIn(host)[0] ?? null;
      while (el && el !== header) {
        hidingTokens.push(...[...el.classList].filter((token) => /(^|:)hidden$/.test(token)));
        el = el.parentElement;
      }

      expect(ctasIn(host)).toHaveLength(1);
      expect(hidingTokens).toEqual([]);
    });

    it('Given le bouton d’appel When on le clique Then le SectionScroller mène au formulaire de la page, ou à défaut au contact de l’accueil', async () => {
      const { fixture, scroller } = await setup();
      const button = nativeButtonOf(ctasIn(fixture.nativeElement as HTMLElement)[0]);

      expect(button).toBeInstanceOf(HTMLButtonElement);
      button?.click();
      expect(scroller.scrollToRequestForm).toHaveBeenCalledOnce();
      expect(scroller.scrollTo).not.toHaveBeenCalled();
    });

    it('Given le bouton d’appel When on le clique Then le clic est mesuré sous l’identifiant header_contact', async () => {
      const { fixture, analytics } = await setup();
      const button = nativeButtonOf(ctasIn(fixture.nativeElement as HTMLElement)[0]);

      expect(button).toBeInstanceOf(HTMLButtonElement);
      button?.click();
      expect(analytics.trackCtaClick).toHaveBeenCalledExactlyOnceWith(
        'header_contact',
        'Décrire mon projet',
      );
    });
  });

  describe('landmark banner', () => {
    const banner = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
      fixture.nativeElement.children[0] as HTMLElement;

    it('Given l’en-tête When il est rendu Then l’host ne contient qu’un header puis le drawer', async () => {
      const { fixture } = await setup();
      const host = fixture.nativeElement as HTMLElement;

      expect(Array.from(host.children).map((el) => el.tagName.toLowerCase())).toEqual([
        'header',
        'app-drawer',
      ]);
    });

    it('Given l’en-tête When il est rendu Then le header contient le lien d’accueil, la navigation principale et le bouton de thème', async () => {
      const { fixture } = await setup();
      const header = banner(fixture);

      expect(header.tagName.toLowerCase()).toBe('header');
      expect(header.querySelector('a[href="/"]')).not.toBeNull();
      expect(header.querySelector('nav[aria-label="Navigation principale"]')).not.toBeNull();
      expect(
        header.querySelector(
          'button[aria-label="Passer en mode sombre"], button[aria-label="Passer en mode clair"]',
        ),
      ).not.toBeNull();
    });

    it('Given le menu mobile ouvert When il est rendu Then le dialog reste hors du header', async () => {
      const { component, fixture } = await setup();
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      const dialog = host.querySelector('[role="dialog"]');
      const header = banner(fixture);

      expect(dialog).not.toBeNull();
      expect(header.tagName.toLowerCase()).toBe('header');
      expect(header.contains(dialog)).toBe(false);
    });
  });

  describe('toggle de thème', () => {
    const themeButton = (host: HTMLElement): HTMLButtonElement | null =>
      host.querySelector<HTMLButtonElement>(
        'header button[aria-label="Passer en mode clair"], header button[aria-label="Passer en mode sombre"]',
      );

    it('Given a stored dark preference When the header theme button is pressed Then the shared store holds light, the page leaves the dark register and the choice is stored', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const { fixture } = await setup();
      const button = themeButton(fixture.nativeElement as HTMLElement);
      const labelBefore = button?.getAttribute('aria-label');

      button?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      TestBed.tick();

      expect({
        labelBefore,
        labelAfter: themeButton(fixture.nativeElement as HTMLElement)?.getAttribute('aria-label'),
        preference: TestBed.inject(ThemeStore).preference(),
        htmlDark: document.documentElement.classList.contains('app-dark'),
        stored: localStorage.getItem(THEME_STORAGE_KEY),
      }).toEqual({
        labelBefore: 'Passer en mode clair',
        labelAfter: 'Passer en mode sombre',
        preference: 'light',
        htmlDark: false,
        stored: 'light',
      });
    });

    it.each([
      { systemDark: true, label: 'Passer en mode clair', htmlDark: true },
      { systemDark: false, label: 'Passer en mode sombre', htmlDark: false },
    ])(
      'Given no stored preference and a system dark scheme at $systemDark When the header renders Then it follows the system and stores nothing',
      async ({ systemDark, label, htmlDark }) => {
        const scheme = installSystemColorScheme(systemDark);
        try {
          const { fixture } = await setup();
          TestBed.tick();

          expect({
            label: themeButton(fixture.nativeElement as HTMLElement)?.getAttribute('aria-label'),
            htmlDark: document.documentElement.classList.contains('app-dark'),
            stored: localStorage.getItem(THEME_STORAGE_KEY),
          }).toEqual({ label, htmlDark, stored: null });
        } finally {
          scheme.restore();
        }
      },
    );
  });

  describe('bascule de thème dans le drawer', () => {
    it('Given le menu mobile ouvert When on clique la bascule du drawer Then le thème passe en clair et la préférence est persistée', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const { component, fixture } = await setup();
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      const toggles = Array.from(
        host.querySelectorAll<HTMLElement>('[data-testid="drawer-theme-toggle"]'),
      );
      const button =
        toggles[0] instanceof HTMLButtonElement
          ? toggles[0]
          : (toggles[0]?.querySelector('button') ?? null);

      expect(toggles).toHaveLength(1);
      expect(toggles[0]?.closest('[role="dialog"]')).not.toBeNull();
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(document.documentElement.classList.contains('app-dark')).toBe(true);

      button?.click();
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

    it('Given le menu mobile ouvert When on choisit Méthode Then il défile vers la section et se ferme', async () => {
      const { component, fixture, scroller } = await setup();
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
      const mobileNav = (fixture.nativeElement as HTMLElement).querySelector(
        'nav[aria-label="Navigation mobile"]',
      ) as HTMLElement;
      const methode = Array.from(
        mobileNav.querySelectorAll<HTMLButtonElement>('button[type="button"]'),
      ).find((button) => button.textContent?.trim() === 'Méthode');

      expect(methode).toBeInstanceOf(HTMLButtonElement);
      methode?.click();
      expect(scroller.scrollTo).toHaveBeenCalledExactlyOnceWith('methode');
      expect(component['isMobileMenuOpen']()).toBe(false);
    });

    it('closeMobileMenu force la fermeture', async () => {
      const { component } = await setup();
      component['isMobileMenuOpen'].set(true);
      component['closeMobileMenu']();
      expect(component['isMobileMenuOpen']()).toBe(false);
    });
  });

  describe('public recruteur', () => {
    it('Given un CV disponible When l’en-tête et son menu mobile sont rendus Then aucun lien CV n’y figure et le CV n’est pas consulté', async () => {
      const getCurrent = vi.fn(() => of(cvInfo()));
      const { component, fixture } = await setup({
        cv: makeCvGateway({ getCurrent, getDownloadUrl: () => 'https://cdn.example/cv.pdf' }),
      });
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('[role="dialog"]')).not.toBeNull();
      expect(host.querySelectorAll('a[href="https://cdn.example/cv.pdf"]')).toHaveLength(0);
      expect(getCurrent).not.toHaveBeenCalled();
    });
  });
});
