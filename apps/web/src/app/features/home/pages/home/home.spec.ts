import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
  type DeferBlockFixture,
} from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { Home } from './home';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { SectionVisibility } from '@core/navigation/section-visibility';
import { ActiveSection } from '@core/navigation/active-section';
import { ContactForm } from '@features/contact/application/contact-form';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import type { HomeBundle } from '@features/home/domain/models/home-bundle.model';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { HOME_HERO_CTA_LABELS } from '../../domain/home-hero.static-data';
import { STATIC_HERO } from '../../infra/data/home.static-data';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';

@Component({ template: '' })
class BlankPage {}

const bundle = (overrides: Partial<HomeBundle> = {}): HomeBundle => ({
  hero: { id: 'hero', headline: 'Je livre', lead: 'Preuve' },
  featuredProjects: [],
  latestPosts: [],
  ...overrides,
});

function makeHomeGateway(overrides: Partial<HomeGateway> = {}): HomeGateway {
  return {
    getHomeBundle: () => of(bundle()),
    invalidateBundle: vi.fn(),
    ...overrides,
  } as unknown as HomeGateway;
}

function makeContactGateway(): ContactGateway {
  return {
    submitContactForm: () => of({ success: true, message: 'OK' }),
    getAllMessages: () => of([]),
    markMessageAsRead: vi.fn(),
    deleteMessage: vi.fn(),
    getUnreadCount: () => of(0),
    invalidateUnreadCount: vi.fn(),
    markAllRead: () => of({ count: 0 }),
  } as unknown as ContactGateway;
}

type AnalyticsStub = {
  readonly gateway: AnalyticsGateway;
  readonly trackCtaClick: Mock<AnalyticsGateway['trackCtaClick']>;
  readonly trackProjectClick: Mock<AnalyticsGateway['trackProjectClick']>;
  readonly trackContactSubmit: Mock<AnalyticsGateway['trackContactSubmit']>;
  readonly trackSectionView: Mock<AnalyticsGateway['trackSectionView']>;
};

function makeAnalytics(): AnalyticsStub {
  const trackCtaClick = vi.fn<AnalyticsGateway['trackCtaClick']>();
  const trackProjectClick = vi.fn<AnalyticsGateway['trackProjectClick']>();
  const trackContactSubmit = vi.fn<AnalyticsGateway['trackContactSubmit']>();
  const trackSectionView = vi.fn<AnalyticsGateway['trackSectionView']>();
  return {
    gateway: stubAnalyticsGateway({
      trackCtaClick,
      trackProjectClick,
      trackContactSubmit,
      trackSectionView,
    }),
    trackCtaClick,
    trackProjectClick,
    trackContactSubmit,
    trackSectionView,
  };
}

type SectionScrollerStub = {
  eager: ReturnType<typeof signal<boolean>>;
  scrollTo: Mock<(sectionId: string) => void>;
};

function makeScroller(eager = false): SectionScrollerStub {
  return { eager: signal(eager), scrollTo: vi.fn<(sectionId: string) => void>() };
}

async function setup(
  options: { gateway?: HomeGateway; scroller?: SectionScrollerStub } = {},
): Promise<{
  component: Home;
  scroller: SectionScrollerStub;
  fixture: ComponentFixture<Home>;
  analytics: AnalyticsStub;
}> {
  const gateway = options.gateway ?? makeHomeGateway();
  const scroller = options.scroller ?? makeScroller();
  const analytics = makeAnalytics();

  TestBed.configureTestingModule({
    providers: [
      { provide: HomeGateway, useValue: gateway },
      { provide: SectionScroller, useValue: scroller },
      { provide: AnalyticsGateway, useValue: analytics.gateway },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });

  // Le template de Home utilise `@defer` : ses dépendances différées ne sont pas
  // résolues par compileComponents en zoneless. On caractérise la logique TS du
  // smart (bundle/resource, dérivés, eager) via un template minimal sans children.
  TestBed.overrideComponent(Home, {
    set: { imports: [], template: '<div></div>' },
  });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { component: fixture.componentInstance, scroller, fixture, analytics };
}

type DeferHarness = {
  fixture: ComponentFixture<Home>;
  blocks: readonly DeferBlockFixture[];
  /** Absent quand aucun article n'est publié : la section n'est pas rendue du tout. */
  postsBlock: DeferBlockFixture | null;
  projectsBlock: DeferBlockFixture;
  contactBlock: DeferBlockFixture;
  analytics: AnalyticsStub;
  scroller: SectionScrollerStub;
};

async function renderHomeTemplate(
  featuredProjects: readonly Project[] = [],
  overrides: Partial<HomeBundle> = {},
): Promise<DeferHarness> {
  const analytics = makeAnalytics();
  const scroller = makeScroller();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'about', component: BlankPage },
        { path: 'blog', component: BlankPage },
        { path: 'blog/:slug', component: BlankPage },
        { path: 'projects', component: BlankPage },
        { path: 'rendez-vous', component: BlankPage },
      ]),
      {
        provide: HomeGateway,
        useValue: makeHomeGateway({
          getHomeBundle: () => of(bundle({ featuredProjects, ...overrides })),
        }),
      },
      { provide: SectionScroller, useValue: scroller },
      { provide: ContactGateway, useValue: makeContactGateway() },
      { provide: AnalyticsGateway, useValue: analytics.gateway },
    ],
    deferBlockBehavior: DeferBlockBehavior.Manual,
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  // Ordre du template : articles (si publiés), projets, contact.
  const blocks = await fixture.getDeferBlocks();
  return {
    fixture,
    blocks,
    postsBlock: blocks.length === 3 ? blocks[0] : null,
    projectsBlock: blocks[blocks.length - 2],
    contactBlock: blocks[blocks.length - 1],
    analytics,
    scroller,
  };
}

async function renderAllDeferred({ fixture, blocks }: DeferHarness): Promise<void> {
  for (const block of blocks) {
    await block.render(DeferBlockState.Complete);
  }
  await fixture.whenStable();
  fixture.detectChanges();
}

function byTestId(fixture: ComponentFixture<Home>, id: string): HTMLElement | null {
  const root = fixture.nativeElement as HTMLElement;
  return root.querySelector(`[data-testid="${id}"]`);
}

function allByTestId(fixture: ComponentFixture<Home>, id: string): readonly HTMLElement[] {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
}

function followEachOther(sequence: readonly (HTMLElement | null)[]): readonly boolean[] {
  return sequence
    .slice(1)
    .map((el, i) =>
      Boolean(
        (sequence[i]?.compareDocumentPosition(el as Node) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    );
}

describe('Home', () => {
  describe('binding du bundle (rxResource)', () => {
    it('expose le bundle chargé via le HomeGateway', async () => {
      const { component } = await setup({
        gateway: makeHomeGateway({ getHomeBundle: () => of(bundle()) }),
      });
      expect(component['bundle']()?.hero?.headline).toBe('Je livre');
    });
  });

  describe('déclenchement des sections eager', () => {
    it('eagerSections reflète le signal eager du SectionScroller (false)', async () => {
      const { component } = await setup({ scroller: makeScroller(false) });
      expect(component['eagerSections']()).toBe(false);
    });

    it('eagerSections passe à true quand le scroller bascule eager', async () => {
      const scroller = makeScroller(false);
      const { component } = await setup({ scroller });
      scroller.eager.set(true);
      expect(component['eagerSections']()).toBe(true);
    });
  });

  describe('rendu du bloc @defer projets', () => {
    it('Given le template réel When le bloc reste à son état initial Then le placeholder est rendu et la section projets absente', async () => {
      const { fixture } = await renderHomeTemplate([makeProject()]);

      expect(byTestId(fixture, 'home-projects-placeholder')).not.toBeNull();
      expect(byTestId(fixture, 'home-projects-section')).toBeNull();
    });

    it('Given deux projets mis en avant When le bloc passe à Complete Then la section remplace le placeholder', async () => {
      const projects = [
        makeProject({ id: 'p1', slug: 'alpha', title: 'Alpha' }),
        makeProject({ id: 'p2', slug: 'beta', title: 'Beta' }),
      ];
      const { fixture, projectsBlock } = await renderHomeTemplate(projects);

      await projectsBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(byTestId(fixture, 'home-projects-section')).not.toBeNull();
      expect(byTestId(fixture, 'home-projects-placeholder')).toBeNull();
    });

    it('Given deux projets mis en avant When le bloc passe à Complete Then une carte par projet est projetée', async () => {
      const projects = [
        makeProject({ id: 'p1', slug: 'alpha', title: 'Alpha' }),
        makeProject({ id: 'p2', slug: 'beta', title: 'Beta' }),
      ];
      const { fixture, projectsBlock } = await renderHomeTemplate(projects);

      await projectsBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(allByTestId(fixture, 'featured-project-card-link')).toHaveLength(2);
    });
  });

  describe('appels du premier écran', () => {
    it.each([
      { testId: 'hero-cta-blog', ctaId: 'home_hero_blog', label: HOME_HERO_CTA_LABELS.blog },
      {
        testId: 'hero-cta-projects',
        ctaId: 'home_hero_projects',
        label: HOME_HERO_CTA_LABELS.projects,
      },
    ])(
      'Given le hero rendu When le visiteur suit $testId Then la page mesure $ctaId une fois, sans faire défiler',
      async ({ testId, ctaId, label }) => {
        const { fixture, analytics, scroller } = await renderHomeTemplate([], {
          hero: STATIC_HERO,
        });

        byTestId(fixture, testId)?.click();
        await fixture.whenStable();

        expect(analytics.trackCtaClick.mock.calls).toEqual([[ctaId, label]]);
        expect(scroller.scrollTo).not.toHaveBeenCalled();
      },
    );
  });

  describe('derniers articles', () => {
    const posts: readonly BlogPost[] = [
      makeBlogPost({ slug: 'a', title: 'Article A', publishedAt: '2026-09-01T08:00:00Z' }),
      makeBlogPost({ slug: 'b', title: 'Article B', publishedAt: '2026-08-01T08:00:00Z' }),
    ];

    it('Given aucun article publié When la page est rendue Then ni section ni place réservée n’existent', async () => {
      const harness = await renderHomeTemplate([], { latestPosts: [] });

      expect([
        harness.postsBlock,
        byTestId(harness.fixture, 'home-latest-posts-placeholder'),
      ]).toEqual([null, null]);
    });

    it('Given des articles publiés When le bloc reste à son état initial Then le placeholder réserve la place', async () => {
      const { fixture } = await renderHomeTemplate([], { latestPosts: posts });

      expect(byTestId(fixture, 'home-latest-posts-placeholder')).not.toBeNull();
      expect(byTestId(fixture, 'home-latest-posts')).toBeNull();
    });

    it('Given des articles publiés When le bloc passe à Complete Then chaque article mène à sa page, dans l’ordre du bundle', async () => {
      const { fixture, postsBlock } = await renderHomeTemplate([], { latestPosts: posts });

      await postsBlock?.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(
        allByTestId(fixture, 'home-latest-post-link').map((link) => link.getAttribute('href')),
      ).toEqual(['/blog/a', '/blog/b']);
    });
  });

  describe('avis clients', () => {
    it('Given toutes les sections rendues When la page est lue Then aucune section d’avis n’existe', async () => {
      const harness = await renderHomeTemplate([], { hero: STATIC_HERO });
      await renderAllDeferred(harness);

      expect([
        byTestId(harness.fixture, 'home-reviews'),
        byTestId(harness.fixture, 'home-reviews-placeholder'),
      ]).toEqual([null, null]);
    });
  });

  describe('mesure des projets mis en avant', () => {
    it('Given le bloc projets Complete When le visiteur ouvre l’application d’un projet Then la page mesure ce projet une fois', async () => {
      const projects = [
        makeProject({ id: 'p1', slug: 'alpha', title: 'Alpha' }),
        makeProject({ id: 'p2', slug: 'beta', title: 'Beta', liveUrl: 'https://beta.test/' }),
      ];
      const { fixture, projectsBlock, analytics } = await renderHomeTemplate(projects);
      await projectsBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      byTestId(fixture, 'featured-project-card-live-link')?.click();

      expect(analytics.trackProjectClick).toHaveBeenCalledExactlyOnceWith('p2', 'Beta');
    });
  });

  describe('landmarks', () => {
    it('Given le template réel When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
      const { fixture } = await renderHomeTemplate([makeProject()]);
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelectorAll('main')).toHaveLength(0);
      expect([...host.classList].sort()).toEqual(['flex', 'flex-col', 'w-full']);
    });
  });

  describe('rendu du bloc @defer contact', () => {
    it('Given le template réel When le bloc reste à son état initial Then le placeholder est rendu et le formulaire absent', async () => {
      const { fixture } = await renderHomeTemplate();

      expect(byTestId(fixture, 'home-contact-placeholder')).not.toBeNull();
      expect(byTestId(fixture, 'home-contact-form')).toBeNull();
    });

    it('Given le template réel When le bloc passe à Complete Then le formulaire remplace le placeholder', async () => {
      const { fixture, contactBlock } = await renderHomeTemplate();

      await contactBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(byTestId(fixture, 'home-contact-form')).not.toBeNull();
      expect(byTestId(fixture, 'home-contact-placeholder')).toBeNull();
    });

    it('Given le template réel When le bloc passe à Complete Then le formulaire réactif est monté hors navigateur', async () => {
      const { fixture, contactBlock } = await renderHomeTemplate();

      await contactBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('form')).not.toBeNull();
    });

    it('Given le bloc contact rendu When la section est lue Then elle propose de réserver un appel, dans l’ancre contact', async () => {
      const { fixture, contactBlock } = await renderHomeTemplate();

      await contactBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      const links = allByTestId(fixture, 'contact-booking-link');
      expect(links.map((link) => link.getAttribute('href'))).toEqual(['/rendez-vous']);
      expect(links[0]?.closest('[id="contact"]') ?? null).not.toBeNull();
    });

    it('Given le bloc contact rendu When le formulaire est lu Then il ne demande plus de type de projet tiré des offres', async () => {
      const { fixture, contactBlock } = await renderHomeTemplate();

      await contactBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          '[data-testid="contact-project-type"]',
        ),
      ).toBeNull();
    });
  });

  describe('mesure du contact', () => {
    it('Given the contact block rendered When its form is sent Then the submission is counted under home', async () => {
      const { fixture, contactBlock, analytics } = await renderHomeTemplate();
      await contactBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();
      const form = fixture.debugElement.query(By.directive(ContactForm))
        .componentInstance as ContactForm;
      const fields = form.contactForm;
      fields.name().value.set('Alice');
      fields.email().value.set('alice@example.com');
      fields.subject().value.set('Projet de site');
      fields.message().value.set('Bonjour, j’aimerais discuter d’un projet.');
      await fixture.whenStable();

      await form.submitContact();
      await fixture.whenStable();

      expect(analytics.trackContactSubmit.mock.calls).toEqual([['home']]);
    });

    it('Given the home When the contact section becomes active, then another one, then contact again Then the arrival on the form is reported once, on the home path', async () => {
      const { fixture, analytics } = await setup();
      const active = TestBed.inject(ActiveSection);

      active.set('contact');
      await fixture.whenStable();
      active.set('other');
      await fixture.whenStable();
      active.set('contact');
      await fixture.whenStable();

      expect(analytics.trackSectionView.mock.calls).toEqual([['home_contact', '/']]);
    });

    it('Given the home When only another section becomes active Then no arrival on the form is reported', async () => {
      const { fixture, analytics } = await setup();

      TestBed.inject(ActiveSection).set('other');
      await fixture.whenStable();

      expect(analytics.trackSectionView).not.toHaveBeenCalled();
    });
  });

  describe('composition de la home', () => {
    it('Given le template réel When la page est rendue Then hero, derniers articles, réalisations puis contact se suivent dans le DOM', async () => {
      const { fixture } = await renderHomeTemplate([], {
        latestPosts: [makeBlogPost({ publishedAt: '2026-09-01T08:00:00Z' })],
      });

      const sequence = [
        'hero-headline',
        'home-latest-posts-placeholder',
        'home-projects-placeholder',
        'home-contact-placeholder',
      ].map((id) => byTestId(fixture, id));
      expect(sequence.map((el) => el !== null)).toEqual(Array(4).fill(true));
      expect(followEachOther(sequence)).toEqual(Array(3).fill(true));
    });

    it.each([
      'home-offers',
      'home-method-placeholder',
      'home-why-placeholder',
      'home-faq-placeholder',
      'hero-booking-link',
    ])(
      'Given toutes les sections rendues When la page est lue Then la section commerciale %s a disparu',
      async (testId) => {
        const harness = await renderHomeTemplate([], { hero: STATIC_HERO });
        await renderAllDeferred(harness);

        expect(byTestId(harness.fixture, testId)).toBeNull();
      },
    );

    it('Given toutes les sections rendues When la page est lue Then l’ancre methode n’existe plus et seul le contact est observé', async () => {
      const harness = await renderHomeTemplate();
      await renderAllDeferred(harness);
      const { fixture } = harness;

      expect((fixture.nativeElement as HTMLElement).querySelector('[id="methode"]')).toBeNull();
      expect(
        fixture.debugElement
          .queryAll(By.directive(SectionVisibility))
          .map((el) => el.injector.get(SectionVisibility).sectionId()),
      ).toEqual(['contact']);
    });

    it('Given le hero livré et toutes les sections rendues When la page est lue Then aucun texte ne vend ni ne parle d’emploi', async () => {
      const harness = await renderHomeTemplate([], { hero: STATIC_HERO });
      await renderAllDeferred(harness);
      const root = harness.fixture.nativeElement as HTMLElement;

      expect(byTestId(harness.fixture, 'home-contact-form')).not.toBeNull();
      expect(root.textContent).not.toMatch(/\bCDI\b|devis|freelance|à prix annoncé/i);
    });

    describe('page entière', () => {
      let root: HTMLElement;

      beforeEach(async () => {
        const harness = await renderHomeTemplate([makeProject()], {
          latestPosts: [makeBlogPost({ publishedAt: '2026-09-01T08:00:00Z' })],
        });
        await renderAllDeferred(harness);
        root = harness.fixture.nativeElement as HTMLElement;
      });

      it('keeps a single h1 once every section is rendered', () => {
        expect(root.querySelectorAll('h1')).toHaveLength(1);
      });

      it('gives every element a distinct id, so that each section label resolves to one heading', () => {
        const ids = Array.from(root.querySelectorAll('[id]')).map((el) => el.id);
        expect(ids.length - new Set(ids).size).toBe(0);
        const labels = Array.from(root.querySelectorAll('section[aria-labelledby]')).map(
          (section) => root.querySelectorAll(`[id="${section.getAttribute('aria-labelledby')}"]`),
        );
        expect(labels.map((found) => found.length)).toEqual(Array(labels.length).fill(1));
      });

      it('never skips a heading level: h1, then h2 sections, then h3 entries', () => {
        const levels = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) =>
          Number(h.tagName.slice(1)),
        );
        expect(levels[0]).toBe(1);
        expect(levels.slice(1).every((level, i) => level - levels[i] <= 1)).toBe(true);
      });

      it('emits no main, and no header nor footer outside a section', () => {
        const strayBanners = Array.from(root.querySelectorAll('header, footer')).filter(
          (el) => el.closest('section') === null,
        );
        expect([root.querySelectorAll('main').length, strayBanners.length]).toEqual([0, 0]);
      });
    });
  });
});
