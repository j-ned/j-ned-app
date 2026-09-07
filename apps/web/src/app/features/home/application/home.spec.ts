import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
  type DeferBlockFixture,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Home } from './home';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import type { HomeBundle } from '@features/home/domain/models/home-bundle.model';
import type { HomeHighlight } from '@features/home/domain/models/home-highlight.model';
import type { Project } from '@features/projects/domain/models/project.model';

const highlight = (overrides: Partial<HomeHighlight> = {}): HomeHighlight => ({
  id: 'h1',
  title: 'Front',
  description: 'desc',
  icon: 'lucide-code',
  ...overrides,
});

const aProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  title: 'Portfolio',
  slug: 'portfolio',
  category: 'Web',
  tags: [],
  description: 'desc',
  image: '',
  featured: true,
  order: 0,
  ...overrides,
});

const bundle = (overrides: Partial<HomeBundle> = {}): HomeBundle => ({
  hero: { id: 'hero', name: 'Julien', tagline: 'Dev', availability: 'open' },
  highlights: [highlight()],
  featuredProjects: [],
  ...overrides,
});

function makeHomeGateway(overrides: Partial<HomeGateway> = {}): HomeGateway {
  return {
    getHomeBundle: () => of(bundle()),
    invalidateBundle: vi.fn(),
    getHeroData: () => of(bundle().hero),
    getHomeHighlights: () => of(bundle().highlights),
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

function makeAnalyticsGateway(): AnalyticsGateway {
  return { trackProjectClick: vi.fn() } as unknown as AnalyticsGateway;
}

type SectionScrollerStub = { eager: ReturnType<typeof signal<boolean>> };

function makeScroller(eager = false): SectionScrollerStub {
  return { eager: signal(eager) };
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
  projectsBlock: DeferBlockFixture;
  contactBlock: DeferBlockFixture;
};

async function renderHomeTemplate(
  featuredProjects: readonly Project[] = [],
): Promise<DeferHarness> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: HomeGateway,
        useValue: makeHomeGateway({ getHomeBundle: () => of(bundle({ featuredProjects })) }),
      },
      { provide: SectionScroller, useValue: makeScroller() },
      { provide: ContactGateway, useValue: makeContactGateway() },
      { provide: AnalyticsGateway, useValue: makeAnalyticsGateway() },
    ],
    deferBlockBehavior: DeferBlockBehavior.Manual,
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  const [projectsBlock, contactBlock] = await fixture.getDeferBlocks();
  return { fixture, projectsBlock, contactBlock };
}

function byTestId(fixture: ComponentFixture<Home>, id: string): HTMLElement | null {
  const root = fixture.nativeElement as HTMLElement;
  return root.querySelector(`[data-testid="${id}"]`);
}

function allByTestId(fixture: ComponentFixture<Home>, id: string): readonly HTMLElement[] {
  const root = fixture.nativeElement as HTMLElement;
  return Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
}

describe('Home', () => {
  describe('binding du bundle (rxResource)', () => {
    it('expose le bundle chargé via le HomeGateway', async () => {
      const { component } = await setup({
        gateway: makeHomeGateway({
          getHomeBundle: () => of(bundle({ highlights: [highlight({ id: 'a' })] })),
        }),
      });
      expect(component['bundle']()?.hero?.name).toBe('Julien');
    });
  });

  describe('valeurs dérivées', () => {
    it('expertises dérive les highlights du bundle', async () => {
      const { component } = await setup({
        gateway: makeHomeGateway({
          getHomeBundle: () =>
            of(bundle({ highlights: [highlight({ id: 'a' }), highlight({ id: 'b' })] })),
        }),
      });
      expect(component['expertises']().map((h) => h.id)).toEqual(['a', 'b']);
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
      const { fixture } = await renderHomeTemplate([aProject()]);

      expect(byTestId(fixture, 'home-projects-placeholder')).not.toBeNull();
      expect(byTestId(fixture, 'home-projects-section')).toBeNull();
    });

    it('Given deux projets mis en avant When le bloc passe à Complete Then la section remplace le placeholder', async () => {
      const projects = [
        aProject({ id: 'p1', slug: 'alpha', title: 'Alpha' }),
        aProject({ id: 'p2', slug: 'beta', title: 'Beta' }),
      ];
      const { fixture, projectsBlock } = await renderHomeTemplate(projects);

      await projectsBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(byTestId(fixture, 'home-projects-section')).not.toBeNull();
      expect(byTestId(fixture, 'home-projects-placeholder')).toBeNull();
    });

    it('Given deux projets mis en avant When le bloc passe à Complete Then une carte par projet est projetée', async () => {
      const projects = [
        aProject({ id: 'p1', slug: 'alpha', title: 'Alpha' }),
        aProject({ id: 'p2', slug: 'beta', title: 'Beta' }),
      ];
      const { fixture, projectsBlock } = await renderHomeTemplate(projects);

      await projectsBlock.render(DeferBlockState.Complete);
      await fixture.whenStable();

      expect(allByTestId(fixture, 'project-card-link')).toHaveLength(2);
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
  });
});
