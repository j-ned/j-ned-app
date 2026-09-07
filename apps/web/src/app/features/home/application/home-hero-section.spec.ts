import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi, type MockInstance } from 'vitest';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { HomeHeroSection } from './home-hero-section';

describe('HomeHeroSection', () => {
  let fixture: ComponentFixture<HomeHeroSection>;
  let navigate: MockInstance<Router['navigate']>;
  const trackCtaClick = vi.fn();

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const clickCta = (): void => {
    host().querySelector<HTMLButtonElement>('[data-testid="hero-cta-projects"] button')?.click();
  };

  beforeEach(async () => {
    trackCtaClick.mockClear();
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AnalyticsGateway, useValue: { trackCtaClick } }],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeHeroSection);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentRef.setInput('hero', null);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Les 3 CTA d'origine répétaient Projets / Contact / À propos, déjà servis par
  // `NAV_LINKS` trois lignes plus bas : zéro capacité de navigation ajoutée, et
  // autant de hauteur volée à la section projets.
  it('renders a single call to action', () => {
    expect(host().querySelectorAll('app-button').length).toBe(1);
  });

  it('sends the visitor to the projects route', () => {
    clickCta();
    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('tracks the cta_click when the visitor leaves for the projects route', () => {
    clickCta();
    expect(trackCtaClick).toHaveBeenCalledWith('home_hero_projects', 'Voir les projets');
  });
});
