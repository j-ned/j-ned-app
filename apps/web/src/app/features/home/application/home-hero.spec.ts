import { ComponentFixture, TestBed } from '@angular/core/testing';
import { STATIC_HERO } from '../infra/data/home.static-data';
import { HomeHero } from './home-hero';

describe('HomeHero', () => {
  let fixture: ComponentFixture<HomeHero>;

  const renderWith = (hero: typeof STATIC_HERO): void => {
    fixture.componentRef.setInput('hero', hero);
    fixture.detectChanges();
  };

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const textOf = (testId: string): string =>
    (host().querySelector(`[data-testid="${testId}"]`)?.textContent ?? '').trim();

  const keywords = (): readonly string[] =>
    Array.from(host().querySelectorAll<HTMLElement>('[data-testid="hero-keyword"]')).map(
      (span) => span.textContent ?? '',
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    fixture = TestBed.createComponent(HomeHero);
  });

  it('renders the hero name as the h1', () => {
    renderWith(STATIC_HERO);
    expect(textOf('hero-name')).toBe(STATIC_HERO.name);
  });

  // Le surlignage `--color-primary` du hero est gratuit tant que la tagline
  // écrit `Angular` et `NestJS` littéralement (split dans `HomeHero`) : une
  // réécriture éditoriale qui les paraphrase l'éteindrait en silence.
  it('highlights Angular and NestJS in the shipped tagline', () => {
    renderWith(STATIC_HERO);
    expect(keywords()).toEqual(['Angular', 'NestJS']);
  });

  // La ligne de preuve tient dans le `min-h` déjà réservé par le bloc hero :
  // elle ne coûte aucun pixel au fold tant qu'elle reste sur deux lignes.
  it('renders the support line under the tagline', () => {
    renderWith(STATIC_HERO);
    expect(textOf('hero-support')).toBe(STATIC_HERO.support);
  });

  it('leaves the rest of the tagline unhighlighted', () => {
    renderWith(STATIC_HERO);
    expect(textOf('hero-tagline')).toBe(STATIC_HERO.tagline);
  });
});
