import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
  type DeferBlockFixture,
} from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { Home } from './home';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { SectionVisibility } from '@core/navigation/section-visibility';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import type { HomeBundle } from '@features/home/domain/models/home-bundle.model';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { HOME_HERO_CTA_LABELS } from '../../domain/home-hero.static-data';
import { HOME_OFFERS_HEADING } from '../../domain/home-offers.static-data';
import { HOME_FAQ, HOME_METHOD, HOME_WHY } from '../../domain/home-pitch.static-data';
import { STATIC_HERO } from '../../infra/data/home.static-data';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';

@Component({ template: '' })
class BlankPage {}

const bundle = (overrides: Partial<HomeBundle> = {}): HomeBundle => ({
  hero: { id: 'hero', headline: 'Je livre', lead: 'Preuve' },
  featuredProjects: [],
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
};

function makeAnalytics(): AnalyticsStub {
  const trackCtaClick = vi.fn<AnalyticsGateway['trackCtaClick']>();
  const trackProjectClick = vi.fn<AnalyticsGateway['trackProjectClick']>();
  return {
    gateway: stubAnalyticsGateway({ trackCtaClick, trackProjectClick }),
    trackCtaClick,
    trackProjectClick,
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
): Promise<{ component: Home; scroller: SectionScrollerStub }> {
  const gateway = options.gateway ?? makeHomeGateway();
  const scroller = options.scroller ?? makeScroller();

  TestBed.configureTestingModule({
    providers: [
      { provide: HomeGateway, useValue: gateway },
      { provide: SectionScroller, useValue: scroller },
      { provide: AnalyticsGateway, useValue: makeAnalytics().gateway },
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
  return { component: fixture.componentInstance, scroller };
}

type DeferHarness = {
  fixture: ComponentFixture<Home>;
  blocks: readonly DeferBlockFixture[];
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
        { path: 'offres', component: BlankPage },
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

  const blocks = await fixture.getDeferBlocks();
  return {
    fixture,
    blocks,
    projectsBlock: blocks[0],
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

const text = (el: Element | null | undefined): string =>
  (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

function labelOf(fixture: ComponentFixture<Home>, section: Element | null): HTMLElement | null {
  const labelledBy = section?.getAttribute('aria-labelledby') ?? '';
  const root = fixture.nativeElement as HTMLElement;
  return labelledBy ? root.querySelector<HTMLElement>(`[id="${labelledBy}"]`) : null;
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
    it('Given le hero rendu When le visiteur demande à décrire son projet Then la page mesure home_hero_contact puis fait défiler jusqu’au contact', async () => {
      const { fixture, analytics, scroller } = await renderHomeTemplate([], { hero: STATIC_HERO });

      byTestId(fixture, 'hero-cta-contact')?.click();

      expect(analytics.trackCtaClick).toHaveBeenCalledExactlyOnceWith(
        'home_hero_contact',
        HOME_HERO_CTA_LABELS.contact,
      );
      expect(scroller.scrollTo).toHaveBeenCalledExactlyOnceWith('contact');
      expect(analytics.trackCtaClick.mock.invocationCallOrder[0]).toBeLessThan(
        scroller.scrollTo.mock.invocationCallOrder[0],
      );
    });

    it('Given le hero rendu When le visiteur ouvre les offres Then la page mesure home_hero_offers sans faire défiler', async () => {
      const { fixture, analytics, scroller } = await renderHomeTemplate([], { hero: STATIC_HERO });

      byTestId(fixture, 'hero-cta-offers')?.click();
      await fixture.whenStable();

      expect(analytics.trackCtaClick).toHaveBeenCalledExactlyOnceWith(
        'home_hero_offers',
        HOME_HERO_CTA_LABELS.offers,
      );
      expect(scroller.scrollTo).not.toHaveBeenCalled();
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

    it('Given le bloc contact rendu When le formulaire est lu Then le type de projet propose les noms courts des offres, dans l’ordre du catalogue, puis Autre', async () => {
      const { fixture, contactBlock } = await renderHomeTemplate();

      await contactBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
        'select[data-testid="contact-project-type"]',
      );
      expect([...(select?.options ?? [])].map((option) => option.value)).toEqual([
        '',
        ...OFFERS.map((offer) => offer.shortName),
        'Autre',
      ]);
    });
  });

  describe('home commerciale', () => {
    it('Given le template réel When aucun bloc différé n’est déclenché Then les offres sont déjà rendues, sous l’unique h1', async () => {
      const { fixture } = await renderHomeTemplate();
      const root = fixture.nativeElement as HTMLElement;

      const offers = byTestId(fixture, 'home-offers');
      expect(offers?.tagName).toBe('SECTION');
      expect(text(offers?.querySelector('h2'))).toBe(HOME_OFFERS_HEADING);
      expect(root.querySelectorAll('h1')).toHaveLength(1);
    });

    it('Given le template réel When la page est rendue Then hero, offres, réalisations, méthode, pourquoi moi, FAQ puis contact se suivent dans le DOM', async () => {
      const { fixture } = await renderHomeTemplate();

      const sequence = [
        'hero-headline',
        'home-offers',
        'home-projects-placeholder',
        'home-method-placeholder',
        'home-why-placeholder',
        'home-faq-placeholder',
        'home-contact-placeholder',
      ].map((id) => byTestId(fixture, id));
      expect(sequence.map((el) => el !== null)).toEqual(Array(7).fill(true));
      expect(followEachOther(sequence)).toEqual(Array(6).fill(true));
    });

    it('Given le hero livré et toutes les sections rendues When la page est lue Then aucun texte ne mentionne le CDI', async () => {
      const harness = await renderHomeTemplate([], { hero: STATIC_HERO });
      await renderAllDeferred(harness);
      const { fixture } = harness;
      const root = fixture.nativeElement as HTMLElement;

      expect(byTestId(fixture, 'home-contact-form')).not.toBeNull();
      expect(root.textContent).not.toMatch(/\bCDI\b/);
    });
  });

  describe('méthode, pourquoi moi et FAQ', () => {
    const faqSection = (fixture: ComponentFixture<Home>): HTMLElement | null =>
      byTestId(fixture, 'faq-item')?.closest('section') ?? null;

    it('Given le template réel When aucun bloc différé n’est déclenché Then les trois sections attendent derrière leur placeholder', async () => {
      const { fixture, blocks } = await renderHomeTemplate();

      expect(blocks).toHaveLength(5);
      expect(
        ['home-method-placeholder', 'home-why-placeholder', 'home-faq-placeholder'].map(
          (id) => byTestId(fixture, id) !== null,
        ),
      ).toEqual([true, true, true]);
      expect([byTestId(fixture, 'home-method'), byTestId(fixture, 'home-why')]).toEqual([
        null,
        null,
      ]);
      expect(allByTestId(fixture, 'faq-item')).toHaveLength(0);
    });

    it('Given le template réel When les blocs différés passent à Complete Then les sections remplacent leurs placeholders', async () => {
      const harness = await renderHomeTemplate();
      await renderAllDeferred(harness);
      const { fixture } = harness;

      expect(
        ['home-method-placeholder', 'home-why-placeholder', 'home-faq-placeholder'].map((id) =>
          byTestId(fixture, id),
        ),
      ).toEqual([null, null, null]);
      expect(
        [byTestId(fixture, 'home-method'), byTestId(fixture, 'home-why'), faqSection(fixture)].map(
          (el) => el?.tagName,
        ),
      ).toEqual(['SECTION', 'SECTION', 'SECTION']);
    });

    describe('ancre de la méthode', () => {
      it('Given le template réel When aucun bloc différé n’est déclenché Then l’ancre methode existe déjà, compense le header et enveloppe le placeholder', async () => {
        const { fixture } = await renderHomeTemplate();

        const anchor = byTestId(fixture, 'home-method-placeholder')?.closest('[id="methode"]');
        expect(anchor ?? null).not.toBeNull();
        expect(anchor?.classList.contains('scroll-mt-20')).toBe(true);
      });

      it('Given les blocs différés rendus When la méthode est lue Then elle est dans l’ancre methode', async () => {
        const harness = await renderHomeTemplate();
        await renderAllDeferred(harness);

        const method = byTestId(harness.fixture, 'home-method');
        expect(method?.closest('[id="methode"]') ?? null).not.toBeNull();
      });

      it('Given le template réel When on relève le scroll-spy Then la méthode puis le contact sont observés sur leur ancre', async () => {
        const { fixture } = await renderHomeTemplate();

        const observed = fixture.debugElement
          .queryAll(By.directive(SectionVisibility))
          .map((el) => ({
            id: (el.nativeElement as HTMLElement).id,
            section: el.injector.get(SectionVisibility).sectionId(),
          }));
        expect(observed).toEqual([
          { id: 'methode', section: 'methode' },
          { id: 'contact', section: 'contact' },
        ]);
      });
    });

    describe('méthode', () => {
      let fixture: ComponentFixture<Home>;
      const method = (): HTMLElement | null => byTestId(fixture, 'home-method');

      beforeEach(async () => {
        const harness = await renderHomeTemplate();
        await renderAllDeferred(harness);
        fixture = harness.fixture;
      });

      it('is a section labelled by its h2, with its lead', () => {
        const heading = labelOf(fixture, method());
        expect([heading?.tagName, text(heading)]).toEqual(['H2', HOME_METHOD.heading]);
        expect(text(byTestId(fixture, 'home-method-lead'))).toBe(HOME_METHOD.lead);
      });

      it('sequences the steps as an ordered list, each titled by an h3, in order', () => {
        const steps = allByTestId(fixture, 'home-method-step');
        expect(steps.map((step) => [step.tagName, step.parentElement?.tagName])).toEqual(
          Array(HOME_METHOD.steps.length).fill(['LI', 'OL']),
        );
        expect(
          steps.map((step) => {
            const verb = step.querySelector('[data-testid="home-method-step-verb"]');
            return {
              heading: verb?.tagName,
              verb: text(verb),
              when: text(step.querySelector('[data-testid="home-method-step-when"]')),
              detail: text(step.querySelector('[data-testid="home-method-step-detail"]')),
            };
          }),
        ).toEqual(
          HOME_METHOD.steps.map(({ verb, when, detail }) => ({
            heading: 'H3',
            verb,
            when,
            detail,
          })),
        );
      });

      it('lists the commitments, in order, within the method section', () => {
        const commitments = allByTestId(fixture, 'home-method-commitment');
        expect(commitments.map((item) => item.tagName)).toEqual(
          Array(HOME_METHOD.commitments.length).fill('LI'),
        );
        expect(commitments.map(text)).toEqual(HOME_METHOD.commitments);
        expect(commitments.every((item) => method()?.contains(item))).toBe(true);
      });
    });

    describe('pourquoi moi', () => {
      let fixture: ComponentFixture<Home>;
      const why = (): HTMLElement | null => byTestId(fixture, 'home-why');

      beforeEach(async () => {
        const harness = await renderHomeTemplate();
        await renderAllDeferred(harness);
        fixture = harness.fixture;
      });

      it('is a section labelled by its h2', () => {
        const heading = labelOf(fixture, why());
        expect([heading?.tagName, text(heading)]).toEqual(['H2', HOME_WHY.heading]);
      });

      it('quotes the workshop rule with its attribution', () => {
        const quote = byTestId(fixture, 'home-why-quote');
        expect(quote?.tagName).toBe('BLOCKQUOTE');
        expect(why()?.contains(quote ?? null)).toBe(true);
        expect({
          text: text(byTestId(fixture, 'home-why-quote-text')),
          attribution: text(byTestId(fixture, 'home-why-quote-attribution')),
        }).toEqual(HOME_WHY.quote);
      });

      it('argues with the three key points, lead then detail, in order', () => {
        const points = allByTestId(fixture, 'key-point');
        expect(points.every((point) => why()?.contains(point))).toBe(true);
        expect(
          points.map((point) => ({
            lead: text(point.querySelector('[data-testid="key-point-lead"]')),
            detail: text(point.querySelector('[data-testid="key-point-detail"]')),
          })),
        ).toEqual(HOME_WHY.points.map(({ lead, detail }) => ({ lead, detail })));
      });

      it('links to the career page', () => {
        const link = byTestId(fixture, 'home-why-about-link');
        expect([link?.tagName, link?.getAttribute('href'), text(link)]).toEqual([
          'A',
          '/about',
          HOME_WHY.aboutLinkLabel,
        ]);
      });

      it('navigates to the career page when the link is clicked', async () => {
        const router = TestBed.inject(Router);
        byTestId(fixture, 'home-why-about-link')?.click();
        await fixture.whenStable();
        expect(router.url).toBe('/about');
      });
    });

    describe('FAQ', () => {
      let fixture: ComponentFixture<Home>;

      beforeEach(async () => {
        const harness = await renderHomeTemplate();
        await renderAllDeferred(harness);
        fixture = harness.fixture;
      });

      it('is a section labelled by its h2, with its lead', () => {
        const section = faqSection(fixture);
        const heading = labelOf(fixture, section);
        expect([heading?.tagName, text(heading)]).toEqual(['H2', HOME_FAQ.heading]);
        expect(text(section?.querySelector('[data-testid="faq-lead"]'))).toBe(HOME_FAQ.lead);
      });

      it('renders every question as a closed native disclosure, in order', () => {
        const items = allByTestId(fixture, 'faq-item');
        expect(items.map((item) => [item.tagName, (item as HTMLDetailsElement).open])).toEqual(
          Array(HOME_FAQ.items.length).fill(['DETAILS', false]),
        );
        expect(
          items.map((item) => {
            const question = item.querySelector('[data-testid="faq-question"]');
            return {
              summary: question?.tagName === 'SUMMARY' && question.parentElement === item,
              question: text(question),
              answer: text(item.querySelector('[data-testid="faq-answer"]')),
            };
          }),
        ).toEqual(
          HOME_FAQ.items.map(({ question, answer }) => ({ summary: true, question, answer })),
        );
      });

      it('needs no script to open an answer', () => {
        expect(faqSection(fixture)?.querySelectorAll('button')).toHaveLength(0);
      });
    });

    describe('page entière', () => {
      let fixture: ComponentFixture<Home>;
      let root: HTMLElement;

      beforeEach(async () => {
        const harness = await renderHomeTemplate();
        await renderAllDeferred(harness);
        fixture = harness.fixture;
        root = fixture.nativeElement as HTMLElement;
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

      it('emits no main, and no header nor footer outside a section', () => {
        const strayBanners = Array.from(root.querySelectorAll('header, footer')).filter(
          (el) => el.closest('section') === null,
        );
        expect([root.querySelectorAll('main').length, strayBanners.length]).toEqual([0, 0]);
      });
    });
  });
});
