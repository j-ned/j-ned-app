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

  it('Given le hero livré When il est rendu Then le h1 porte la phrase complète', () => {
    renderWith(STATIC_HERO);
    const h1 = host().querySelector('h1');
    expect(h1?.getAttribute('data-testid')).toBe('hero-headline');
    expect(textOf('hero-headline')).toBe(STATIC_HERO.headline);
  });

  // Titre = élément LCP : un fondu d'entrée repousse le LCP à la fin de l'animation.
  it('Given le hero livré When il est rendu Then le titre est visible au premier rendu, sans animation d’entrée', () => {
    renderWith(STATIC_HERO);
    const headline = host().querySelector<HTMLElement>('[data-testid="hero-headline"]');
    expect(headline).not.toBeNull();
    expect(headline?.className).not.toMatch(/\banimate-/);
  });

  // Le surlignage indigo est gratuit tant que le titre écrit `Angular` et `NestJS`
  // littéralement (split dans `HomeHero`) : une réécriture qui les paraphrase l'éteindrait en silence.
  it('Given le hero livré When il est rendu Then Angular et NestJS sont surlignés', () => {
    renderWith(STATIC_HERO);
    expect(keywords()).toEqual(['Angular', 'NestJS']);
  });

  it('Given le hero livré When il est rendu Then le paragraphe d’appui suit le titre', () => {
    renderWith(STATIC_HERO);
    expect(textOf('hero-lead')).toBe(STATIC_HERO.lead);
  });

  it('Given quatre preuves When le hero est rendu Then le relevé affiche chaque libellé et valeur', () => {
    renderWith(STATIC_HERO);
    const proofs = Array.from(host().querySelectorAll<HTMLElement>('[data-testid="hero-proof"]'));
    expect(proofs).toHaveLength(STATIC_HERO.proofs.length);
    STATIC_HERO.proofs.forEach((proof, i) => {
      expect(proofs[i].querySelector('dt')?.textContent?.trim()).toBe(proof.label);
      expect(proofs[i].textContent).toContain(proof.value);
      expect(proofs[i].textContent).toContain(proof.detail);
    });
  });

  it('Given aucun hero When le composant est rendu Then aucun h1 (squelette seul)', () => {
    fixture.detectChanges();
    expect(host().querySelector('h1')).toBeNull();
  });
});
