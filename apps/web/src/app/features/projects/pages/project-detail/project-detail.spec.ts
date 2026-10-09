import { DeferBlockBehavior, TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ProjectDetail } from './project-detail';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject, makeProjectImage } from '@features/projects/testing/project-builders';

function project(overrides: Partial<Project> = {}): Project {
  return makeProject({
    techChoices: [{ techno: 'NestJS', why: 'modulaire' }],
    architectureDecisions: [{ decision: 'hexagonale', rationale: 'testable' }],
    ...overrides,
  });
}

function setup(projects: Project[]): ComponentFixture<ProjectDetail> {
  const gateway = {
    getAllProjects: () => of(projects as readonly Project[]),
  } as unknown as ProjectsGateway;
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ProjectsGateway, useValue: gateway },
      { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
    ],
  });
  return TestBed.createComponent(ProjectDetail);
}

describe('ProjectDetail', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('affiche le titre et les deux sections du projet correspondant au slug', async () => {
    const fixture = setup([project()]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mon site');
    expect(text).toContain('NestJS');
    expect(text).toContain('modulaire');
    expect(text).toContain('hexagonale');
    expect(text).toContain('testable');
  });

  it('Given le projet du slug When le détail est rendu Then il n’émet aucun main et porte la mise en page sur l’host', async () => {
    const fixture = setup([project()]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain('Mon site');
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pb-16', 'pt-20']);
  });

  it("rend l'image d'en-tête avec un sizes responsive (sans pixel): NG02952", () => {
    const fixture = setup([project({ image: 'https://cdn.test/cover.avif' })]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(img).toBeTruthy();
    // NgOptimizedImage lève NG02952 et n'applique pas le src si `sizes` contient
    // une valeur en pixels → image cassée. Le sizes doit rester 100% responsive.
    expect(img?.getAttribute('sizes') ?? '').not.toContain('px');
  });

  it('redirige vers /projects si le slug est introuvable', async () => {
    const fixture = setup([project({ slug: 'autre' })]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentRef.setInput('slug', 'inexistant');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('expose les liens démo et code source quand ils sont fournis', async () => {
    const fixture = setup([
      project({ liveUrl: 'https://demo.test', repoUrlFront: 'https://github.com/x/front' }),
    ]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll('a[target="_blank"]') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://demo.test');
    expect(hrefs).toContain('https://github.com/x/front');
  });

  it('suit le clic sur un lien projet via AnalyticsGateway', async () => {
    const track = vi.fn();
    const gateway = {
      getAllProjects: () => of([project({ liveUrl: 'https://demo.test' })] as readonly Project[]),
    } as unknown as ProjectsGateway;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProjectsGateway, useValue: gateway },
        { provide: AnalyticsGateway, useValue: { trackProjectClick: track } },
      ],
    });
    const fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const liveLink = fixture.nativeElement.querySelector(
      'a[href="https://demo.test"]',
    ) as HTMLAnchorElement;
    liveLink.click();
    expect(track).toHaveBeenCalledWith('id-1', 'Mon site');
  });

  it('propose la navigation vers le projet suivant dans la liste ordonnée', async () => {
    const fixture = setup([
      project({ slug: 'mon-site', title: 'Mon site' }),
      project({ id: 'id-2', slug: 'autre-projet', title: 'Autre projet' }),
    ]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const navLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a[href="/projects/autre-projet"]'),
    );
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it("affiche un état d'erreur avec relance quand la liste ne charge pas, sans rediriger", async () => {
    let calls = 0;
    const gateway = {
      getAllProjects: () => {
        calls += 1;
        return calls === 1
          ? throwError(() => new Error('down'))
          : of([project()] as readonly Project[]);
      },
    } as unknown as ProjectsGateway;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProjectsGateway, useValue: gateway },
        { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('slug', 'mon-site');
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '[data-testid="project-error"]',
    ) as HTMLElement;
    expect(error).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();

    (error.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="project-error"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Mon site');
  });

  it('Given une stack When le détail est rendu Then chaque outil est un élément de liste', async () => {
    const fixture = setup([project({ tags: ['Angular', 'NestJS', 'PostgreSQL'] })]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="project-stack"] li'),
    ).map((li) => li.textContent?.trim());
    expect(items).toEqual(['Angular', 'NestJS', 'PostgreSQL']);
  });

  it('Given des choix techniques When le détail est rendu Then les sections sont nommées par leur h2, sans numérotation', async () => {
    const fixture = setup([project()]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    for (const id of ['tech-choices-title', 'architecture-decisions-title']) {
      expect(root.querySelector(`section[aria-labelledby="${id}"] h2#${id}`)).not.toBeNull();
    }
    expect(root.querySelector('[data-testid="tech-choices"]')?.textContent).not.toMatch(/\b01\b/);
  });
});

describe('ProjectDetail: nature du projet dans l’en-tête', () => {
  const NBSP = ' ';
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  const render = async (overrides: Partial<Project>): Promise<HTMLElement> => {
    const fixture = setup([project(overrides)]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const kindStamp = (host: HTMLElement): HTMLElement | null =>
    host.querySelector<HTMLElement>('[data-testid="project-detail-kind"]');

  afterEach(() => TestBed.resetTestingModule());

  it.each([
    { kind: 'production', label: 'En production' },
    { kind: 'demo', label: 'Démo' },
    { kind: 'script', label: 'Script' },
  ] as const)(
    'Given the kind $kind When the detail renders Then its header is stamped « $label »',
    async ({ kind, label }) => {
      expect(text(kindStamp(await render({ kind })))).toBe(label);
    },
  );

  it('Given no kind When the detail renders Then its header shows no stamp', async () => {
    expect(kindStamp(await render({ kind: null }))).toBeNull();
  });

  it('Given a stamped detail When it renders Then the stamp comes before the title and is not a heading', async () => {
    const host = await render({ kind: 'production' });
    const stamp = kindStamp(host);
    const title = host.querySelector('[data-testid="project-detail-title"]');

    expect(stamp?.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(
      title && stamp ? stamp.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each([
    { kind: 'production', label: "Ouvrir l'application" },
    { kind: 'demo', label: 'Voir la démo' },
    { kind: 'script', label: 'Voir le site' },
    { kind: null, label: 'Voir le site' },
  ] as const)(
    'Given the kind $kind When the detail renders Then its live link reads « $label », with the project and the new tab spelled out',
    async ({ kind, label }) => {
      const link = (await render({ kind, liveUrl: 'https://dashflow.test/' })).querySelector(
        'a[href="https://dashflow.test/"]',
      );

      expect({ ariaLabel: link?.getAttribute('aria-label') ?? null, name: text(link) }).toEqual({
        ariaLabel: null,
        name: `${label}${NBSP}: Mon site, nouvel onglet`,
      });
    },
  );
});

const normalized = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim();

const accessibleName = (element: Element | null | undefined): string => {
  if (!element) return '';
  const label = element.getAttribute('aria-label');
  if (label !== null) return normalized(label);
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') return '';
    if (node.tagName === 'IMG') return ` ${node.getAttribute('alt') ?? ''} `;
    return [...node.childNodes].map(walk).join('');
  };
  return normalized(walk(element));
};

const CAPTURES = [
  makeProjectImage({
    id: 'dashboard',
    src: 'https://cdn.test/dashboard.avif',
    alt: 'Tableau de bord du mois en cours',
    width: 1600,
    height: 1000,
  }),
  makeProjectImage({
    id: 'mobile',
    src: 'https://cdn.test/mobile.avif',
    alt: 'Trois écrans mobiles : budget, santé, réglages',
    width: 1200,
    height: 900,
  }),
];

const renderDetail = async (overrides: Partial<Project>): Promise<HTMLElement> => {
  const fixture = setup([project(overrides)]);
  fixture.componentRef.setInput('slug', 'mon-site');
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const galleryOf = (host: HTMLElement): HTMLElement | null =>
  host.querySelector<HTMLElement>('[data-testid="project-gallery"]');

describe('ProjectDetail: galerie de captures', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('Given a project without captures When the detail renders Then no gallery section exists', async () => {
    const host = await renderDetail({ gallery: [] });

    expect({
      gallery: galleryOf(host),
      heading: host.querySelector('#gallery-title'),
    }).toEqual({ gallery: null, heading: null });
  });

  it('Given captures When the detail renders Then the gallery is a section named by its « Captures » h2', async () => {
    const gallery = galleryOf(await renderDetail({ gallery: CAPTURES }));
    const heading = gallery?.querySelector(
      'section[aria-labelledby="gallery-title"] h2#gallery-title',
    );

    expect(normalized(heading?.textContent)).toBe('Captures');
  });

  it('Given captures When the detail renders Then each capture is a list item holding one enlarge button, in the gallery order', async () => {
    const gallery = galleryOf(await renderDetail({ gallery: CAPTURES }));
    const items = [...(gallery?.querySelectorAll('ul > li') ?? [])];

    expect(
      items.map((item) => ({
        buttons: item.querySelectorAll('[data-testid="project-gallery-open"]').length,
        alt: item.querySelector('img')?.getAttribute('alt'),
      })),
    ).toEqual([
      { buttons: 1, alt: 'Tableau de bord du mois en cours' },
      { buttons: 1, alt: 'Trois écrans mobiles : budget, santé, réglages' },
    ]);
  });

  it.each(CAPTURES.map((capture, index) => ({ index, capture })))(
    'Given the capture #$index When the gallery renders Then its thumbnail is a lazy optimized image with its intrinsic size and alt',
    async ({ index, capture }) => {
      const gallery = galleryOf(await renderDetail({ gallery: CAPTURES }));
      const image = gallery?.querySelectorAll('[data-testid="project-gallery-open"] img')[index];

      expect({
        src: image?.getAttribute('src'),
        alt: image?.getAttribute('alt'),
        width: image?.getAttribute('width'),
        height: image?.getAttribute('height'),
        loading: image?.getAttribute('loading'),
        fetchpriority: image?.getAttribute('fetchpriority'),
      }).toEqual({
        src: capture.src,
        alt: capture.alt,
        width: String(capture.width),
        height: String(capture.height),
        loading: 'lazy',
        fetchpriority: 'auto',
      });
    },
  );

  it('Given captures and technical choices When the detail renders Then the gallery sits between the cover and the technical choices', async () => {
    const host = await renderDetail({ image: 'https://cdn.test/cover.avif', gallery: CAPTURES });
    const cover = host.querySelector('figure');
    const gallery = galleryOf(host);
    const techChoices = host.querySelector('[data-testid="tech-choices"]');
    const follows = (a: Node | null, b: Node | null): boolean =>
      !!a && !!b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    expect({
      afterCover: follows(cover, gallery),
      beforeTechChoices: follows(gallery, techChoices),
    }).toEqual({ afterCover: true, beforeTechChoices: true });
  });

  it('Given deferred blocks never resolve When the detail first renders Then the gallery is already in the HTML, as the prerender serves it', async () => {
    TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });
    const host = await renderDetail({ gallery: CAPTURES });

    expect(
      galleryOf(host)?.querySelectorAll('[data-testid="project-gallery-open"] img').length,
    ).toBe(2);
  });
});

describe('ProjectDetail: agrandissement d’une capture', () => {
  type Gallery = {
    readonly host: HTMLElement;
    readonly fixture: ComponentFixture<ProjectDetail>;
    readonly openButtons: HTMLButtonElement[];
    readonly dialog: HTMLDialogElement | null;
  };

  const renderGallery = async (): Promise<Gallery> => {
    const fixture = setup([project({ gallery: CAPTURES })]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return {
      host,
      fixture,
      openButtons: [
        ...host.querySelectorAll<HTMLButtonElement>('[data-testid="project-gallery-open"]'),
      ],
      dialog: host.querySelector<HTMLDialogElement>('[data-testid="project-gallery-dialog"]'),
    };
  };

  const closeButtonOf = (gallery: Gallery): HTMLButtonElement | null =>
    gallery.host.querySelector<HTMLButtonElement>('[data-testid="project-gallery-close"]');

  const enlarge = async (
    gallery: Gallery,
    index: number,
  ): Promise<HTMLButtonElement | undefined> => {
    const trigger = gallery.openButtons.at(index);
    trigger?.click();
    await gallery.fixture.whenStable();
    closeButtonOf(gallery)?.focus();
    return trigger;
  };

  // happy-dom does not run the browser's Escape handling of a modal dialog: replay it (cancel, then close).
  const pressEscape = (dialog: HTMLDialogElement): void => {
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) dialog.close();
  };

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('Given a gallery When it renders Then a single native dialog exists, closed', async () => {
    const { host, dialog } = await renderGallery();

    expect({
      dialogs: host.querySelectorAll('[data-testid="project-gallery-dialog"]').length,
      tag: dialog?.tagName,
      open: dialog?.open,
    }).toEqual({ dialogs: 1, tag: 'DIALOG', open: false });
  });

  it.each(CAPTURES.map((capture, index) => ({ index, capture })))(
    'Given the capture #$index When its thumbnail renders Then it is a button named « Agrandir : <alt> »',
    async ({ index, capture }) => {
      const button = (await renderGallery()).openButtons[index];

      expect({
        tag: button?.tagName,
        type: button?.getAttribute('type'),
        name: accessibleName(button),
      }).toEqual({ tag: 'BUTTON', type: 'button', name: `Agrandir : ${capture.alt}` });
    },
  );

  it.each(CAPTURES.map((capture, index) => ({ index, capture })))(
    'Given the capture #$index When its button is activated Then the dialog opens as a modal on that capture, enlarged',
    async ({ index, capture }) => {
      const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
      const gallery = await renderGallery();

      await enlarge(gallery, index);
      const enlarged = gallery.dialog?.querySelector('[data-testid="project-gallery-enlarged"]');

      expect({
        showModal: showModal.mock.calls.length,
        open: gallery.dialog?.open,
        name: normalized(gallery.dialog?.getAttribute('aria-label')),
        src: enlarged?.getAttribute('src'),
        alt: enlarged?.getAttribute('alt'),
        width: enlarged?.getAttribute('width'),
        height: enlarged?.getAttribute('height'),
      }).toEqual({
        showModal: 1,
        open: true,
        name: `Capture agrandie : ${capture.alt}`,
        src: capture.src,
        alt: capture.alt,
        width: String(capture.width),
        height: String(capture.height),
      });
    },
  );

  it('Given an open dialog When it renders Then « Fermer » is its first focusable control', async () => {
    const gallery = await renderGallery();
    await enlarge(gallery, 0);
    const firstFocusable = gallery.dialog?.querySelector(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    expect({
      isClose: firstFocusable === closeButtonOf(gallery),
      name: accessibleName(firstFocusable),
    }).toEqual({ isClose: true, name: 'Fermer' });
  });

  it.each([
    {
      label: 'the « Fermer » button',
      close: (gallery: Gallery): void => closeButtonOf(gallery)?.click(),
    },
    {
      label: 'the Escape key',
      close: (gallery: Gallery): void => {
        if (gallery.dialog) pressEscape(gallery.dialog);
      },
    },
  ])(
    'Given an enlarged capture When the dialog is closed with $label Then it closes and the focus returns to the thumbnail that opened it',
    async ({ close }) => {
      const gallery = await renderGallery();
      const trigger = await enlarge(gallery, 1);

      close(gallery);
      await gallery.fixture.whenStable();

      expect({
        open: gallery.dialog?.open,
        focusOnTrigger: document.activeElement === trigger,
      }).toEqual({ open: false, focusOnTrigger: true });
    },
  );

  it('Given a capture enlarged then closed with Escape When the same thumbnail is activated again Then the dialog reopens', async () => {
    const gallery = await renderGallery();
    await enlarge(gallery, 0);
    if (gallery.dialog) pressEscape(gallery.dialog);
    await gallery.fixture.whenStable();

    await enlarge(gallery, 0);

    expect(gallery.dialog?.open).toBe(true);
  });
});
