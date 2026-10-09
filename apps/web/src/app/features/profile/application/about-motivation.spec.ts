import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SectionScroller } from '@core/navigation/section-scroller';
import { ProfileGateway } from '../domain/gateways/profile.gateway';
import { STATIC_MOTIVATION } from '../infra/data/profile.static-data';
import { fakeProfileGateway } from '../testing/fake-profile-gateway';
import { AboutMotivation } from './about-motivation';

describe('AboutMotivation', () => {
  let fixture: ComponentFixture<AboutMotivation>;
  const scrollTo = vi.fn();
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const click = (testId: string): void =>
    host().querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();

  beforeEach(async () => {
    scrollTo.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProfileGateway, useFactory: fakeProfileGateway },
        { provide: SectionScroller, useValue: { scrollTo } },
      ],
    });
    fixture = TestBed.createComponent(AboutMotivation);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('Given la motivation livrée When la section est rendue Then l’énoncé est affiché', () => {
    expect(host().querySelector('[data-testid="motivation-statement"]')?.textContent?.trim()).toBe(
      STATIC_MOTIVATION.statement,
    );
  });

  it('Given le bouton projets When le visiteur clique Then il part vers /projects', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    click('about-cta-projects');
    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('Given le bouton contact When le visiteur clique Then la section contact de l’accueil est ciblée', () => {
    click('about-cta-contact');
    expect(scrollTo).toHaveBeenCalledWith('contact');
  });
});
