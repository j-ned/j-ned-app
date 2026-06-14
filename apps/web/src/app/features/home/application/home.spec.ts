import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of } from 'rxjs';
import { Home } from './home';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import type { HomeBundle } from '@features/home/domain/models/home-bundle.model';
import type { HomeHighlight } from '@features/home/domain/models/home-highlight.model';

const highlight = (overrides: Partial<HomeHighlight> = {}): HomeHighlight => ({
  id: 'h1',
  title: 'Front',
  description: 'desc',
  icon: 'lucide-code',
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
});
