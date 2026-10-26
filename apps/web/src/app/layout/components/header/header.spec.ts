import { TestBed } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { Header } from './header';
import { NAV_LINKS } from './nav-items';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import type { CvInfo } from '@features/cv/domain/models/cv.model';
import { ThemeStore } from '@core/theme/theme-store';
import { installSystemColorScheme } from '@core/theme/testing/system-color-scheme';

const THEME_STORAGE_KEY = 'j-ned:theme';

@Component({ template: '' })
class BlankPage {}

const DESTINATIONS = ['blog', 'projects', 'about', 'atelier'] as const;

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
};

function makeScroller(): SectionScrollerStub {
  return { scrollTo: vi.fn(), scrollToTop: vi.fn() };
}

async function setup(
  options: {
    analytics?: AnalyticsGateway;
    cv?: CvGateway;
    scroller?: SectionScrollerStub;
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

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AnalyticsGateway, useValue: analytics },
      { provide: CvGateway, useValue: cv },
      { provide: SectionScroller, useValue: scroller },
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
    it("ordonne le menu principal : Blog, Réalisations, Parcours puis L'atelier, sans offre ni section", () => {
      expect(NAV_LINKS).toEqual([
        { label: 'Blog', href: '/blog', icons: 'lucide-book-open' },
        { label: 'Réalisations', href: '/projects', icons: 'lucide-laptop' },
        { label: 'Parcours', href: '/about', icons: 'lucide-user' },
        { label: "L'atelier", href: '/atelier', icons: 'lucide-wrench' },
      ]);
    });

    it('dessert chaque destination de NAV_LINKS par un lien routé, sans bouton de section', async () => {
      const { fixture } = await setup();
      const nav = fixture.nativeElement.querySelector(
        'nav[aria-label="Navigation principale"]',
      ) as HTMLElement;

      expect({
        links: Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href]')).map((a) => [
          a.getAttribute('href'),
          a.textContent?.trim(),
        ]),
        buttons: nav.querySelectorAll('button').length,
      }).toEqual({
        links: NAV_LINKS.map((item) => [item.href, item.label]),
        buttons: 0,
      });
    });

    it.each([
      {
        url: '/blog',
        expected: [
          { href: '/blog', current: 'page', pill: true },
          { href: '/projects', current: null, pill: false },
          { href: '/about', current: null, pill: false },
          { href: '/atelier', current: null, pill: false },
        ],
      },
      {
        url: '/atelier',
        expected: [
          { href: '/blog', current: null, pill: false },
          { href: '/projects', current: null, pill: false },
          { href: '/about', current: null, pill: false },
          { href: '/atelier', current: 'page', pill: true },
        ],
      },
    ])(
      'Given the router on $url When the header renders Then only that entry is the current page, drawn as an accent-tinted pill',
      async ({ url, expected }) => {
        const { fixture } = await setup();
        const router = TestBed.inject(Router);
        router.resetConfig(DESTINATIONS.map((path) => ({ path, component: BlankPage })));
        await router.navigateByUrl(url);
        fixture.detectChanges();
        await fixture.whenStable();
        const nav = (fixture.nativeElement as HTMLElement).querySelector(
          'nav[aria-label="Navigation principale"]',
        ) as HTMLElement;

        expect(
          Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href]')).map((a) => ({
            href: a.getAttribute('href'),
            current: a.getAttribute('aria-current'),
            pill: a.classList.contains('rounded-full') && a.classList.contains('bg-primary/8'),
          })),
        ).toEqual(expected);
      },
    );

    it("Given the mobile menu open When it renders Then L'atelier closes the list, with the wrench icon", async () => {
      const { component, fixture } = await setup();
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
      const links = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
          '[data-testid="mobile-nav"] a[href]',
        ),
      );
      const last = links.at(-1);

      expect({
        count: links.length,
        href: last?.getAttribute('href'),
        label: last?.textContent?.trim(),
        icon: last?.querySelector('use')?.getAttribute('href')?.split('#')[1],
      }).toEqual({ count: 4, href: '/atelier', label: "L'atelier", icon: 'solid-wrench' });
    });

    it("Given the mobile menu open When L'atelier is clicked Then the router lands on /atelier and the menu closes", async () => {
      const { component, fixture } = await setup();
      const router = TestBed.inject(Router);
      router.resetConfig(DESTINATIONS.map((path) => ({ path, component: BlankPage })));
      component['toggleMobileMenu']();
      fixture.detectChanges();
      await fixture.whenStable();
      const link = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
          '[data-testid="mobile-nav"] a[href]',
        ),
      ).find((candidate) => candidate.getAttribute('href') === '/atelier');

      expect(link).toBeInstanceOf(HTMLAnchorElement);
      link?.click();
      await fixture.whenStable();

      expect({ url: router.url, open: component['isMobileMenuOpen']() }).toEqual({
        url: '/atelier',
        open: false,
      });
    });

    it('délègue scrollToTop au clic sur le logo', async () => {
      const { component, scroller } = await setup();
      component['scrollToTop']();
      expect(scroller.scrollToTop).toHaveBeenCalledOnce();
    });
  });

  describe('bouton d’appel « M’écrire »', () => {
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
      expect(button?.textContent?.trim()).toBe("M'écrire");
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

    it('Given le bouton d’appel When on le clique Then le SectionScroller mène au contact de l’accueil', async () => {
      const { fixture, scroller } = await setup();
      const button = nativeButtonOf(ctasIn(fixture.nativeElement as HTMLElement)[0]);

      expect(button).toBeInstanceOf(HTMLButtonElement);
      button?.click();
      expect(scroller.scrollTo).toHaveBeenCalledExactlyOnceWith('contact');
    });

    it('Given le bouton d’appel When on le clique Then le clic est mesuré sous l’identifiant header_contact', async () => {
      const { fixture, analytics } = await setup();
      const button = nativeButtonOf(ctasIn(fixture.nativeElement as HTMLElement)[0]);

      expect(button).toBeInstanceOf(HTMLButtonElement);
      button?.click();
      expect(analytics.trackCtaClick).toHaveBeenCalledExactlyOnceWith('header_contact', "M'écrire");
    });
  });

  describe('monogramme', () => {
    it('Given the header When it renders Then the « JN » monogram is a flat accent disc, on-accent text, with no tint nor border', async () => {
      const { fixture } = await setup();
      const tile = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="header-monogram"]',
      );
      const paint = [...(tile?.classList ?? [])]
        .filter(
          (token) =>
            /^(?:[\w-]+:)*(?:bg|text|border|rounded)(?:-|$)/.test(token) &&
            !/^text-(?:xs|sm|base|lg|\d*xl)$/.test(token),
        )
        .sort();

      expect(paint).toEqual(['bg-primary-bg', 'rounded-full', 'text-on-primary']);
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

    it('closeMobileMenu force la fermeture', async () => {
      const { component } = await setup();
      component['isMobileMenuOpen'].set(true);
      component['closeMobileMenu']();
      expect(component['isMobileMenuOpen']()).toBe(false);
    });
  });

  describe('lien CV', () => {
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
