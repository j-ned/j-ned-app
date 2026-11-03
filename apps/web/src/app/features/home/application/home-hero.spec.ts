import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeHero } from './home-hero';

describe('HomeHero', () => {
  let fixture: ComponentFixture<HomeHero>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    fixture = TestBed.createComponent(HomeHero);
  });

  it('Given aucun hero When le composant est rendu Then aucun h1 (squelette seul)', () => {
    fixture.detectChanges();
    expect(host().querySelector('h1')).toBeNull();
  });
});
