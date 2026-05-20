import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { HomeHeroSection } from './home-hero-section';

describe('HomeHeroSection', () => {
  let fixture: ComponentFixture<HomeHeroSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeHeroSection);
    fixture.componentRef.setInput('hero', null);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders three CTA buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('app-ui-button');
    expect(buttons.length).toBe(3);
  });

  it('exposes scrollToContact and goToAbout methods', () => {
    const cmp = fixture.componentInstance as unknown as {
      goToProjects: () => void;
      scrollToContact: () => void;
      goToAbout: () => void;
    };
    expect(typeof cmp.goToProjects).toBe('function');
    expect(typeof cmp.scrollToContact).toBe('function');
    expect(typeof cmp.goToAbout).toBe('function');
  });

  it('scrollToContact calls scrollIntoView on element with id "contact"', () => {
    const scrollSpy = vi.fn();
    const fakeEl = { scrollIntoView: scrollSpy } as unknown as HTMLElement;
    const doc = TestBed.inject(DOCUMENT) as Document;
    vi.spyOn(doc, 'getElementById').mockReturnValue(fakeEl);

    const cmp = fixture.componentInstance as unknown as { scrollToContact: () => void };
    cmp.scrollToContact();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrollToContact is a no-op when element is missing', () => {
    const doc = TestBed.inject(DOCUMENT) as Document;
    vi.spyOn(doc, 'getElementById').mockReturnValue(null);

    const cmp = fixture.componentInstance as unknown as { scrollToContact: () => void };
    expect(() => cmp.scrollToContact()).not.toThrow();
  });
});
