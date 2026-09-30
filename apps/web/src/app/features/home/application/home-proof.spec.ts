import { ComponentFixture, TestBed } from '@angular/core/testing';
import { STATIC_BUILD_STEPS, STATIC_HOME_HIGHLIGHTS } from '../infra/data/home.static-data';
import { HomeProof } from './home-proof';

describe('HomeProof', () => {
  let fixture: ComponentFixture<HomeProof>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    fixture = TestBed.createComponent(HomeProof);
    fixture.componentRef.setInput('highlights', STATIC_HOME_HIGHLIGHTS);
    fixture.componentRef.setInput('buildSteps', STATIC_BUILD_STEPS);
    fixture.detectChanges();
  });

  it('Given les données livrées When la section est rendue Then elle est nommée par son h2', () => {
    const section = host().querySelector('section');
    const heading = host().querySelector('h2');
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('Given les étapes de build When la section est rendue Then la tuile pipeline les liste dans l’ordre', () => {
    const commands = Array.from(
      host().querySelectorAll('[data-testid="home-proof-pipeline"] li p:first-child'),
    ).map((p) => p.textContent?.trim());
    expect(commands).toEqual(STATIC_BUILD_STEPS.map((step) => step.command));
  });

  it('Given les domaines When la section est rendue Then une tuile par domaine avec ses faits', () => {
    const tiles = Array.from(
      host().querySelectorAll<HTMLElement>('[data-testid="home-proof-tile"]'),
    );
    expect(tiles.map((t) => t.querySelector('h3')?.textContent?.trim())).toEqual(
      STATIC_HOME_HIGHLIGHTS.map((h) => h.title),
    );
    expect(tiles[0].querySelectorAll('dt')).toHaveLength(STATIC_HOME_HIGHLIGHTS[0].facts.length);
  });

  // La grille 4×2 (pipeline 2×2 + 4 tuiles 1×1) ne laisse aucune case vide qu'avec 4 domaines.
  it('Given les données livrées When on compte les domaines Then il y en a exactement 4', () => {
    expect(STATIC_HOME_HIGHLIGHTS).toHaveLength(4);
  });
});
