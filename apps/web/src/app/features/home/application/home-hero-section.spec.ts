import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SectionScroller } from '@core/navigation/section-scroller';
import { HomeHeroSection } from './home-hero-section';

describe('HomeHeroSection', () => {
  let fixture: ComponentFixture<HomeHeroSection>;
  const scrollTo = vi.fn();

  beforeEach(async () => {
    scrollTo.mockClear();
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SectionScroller, useValue: { scrollTo } }],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeHeroSection);
    fixture.componentRef.setInput('hero', null);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders three CTA buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBe(3);
  });

  it('exposes goToProjects, scrollToContact and goToAbout methods', () => {
    const cmp = fixture.componentInstance as unknown as {
      goToProjects: () => void;
      scrollToContact: () => void;
      goToAbout: () => void;
    };
    expect(typeof cmp.goToProjects).toBe('function');
    expect(typeof cmp.scrollToContact).toBe('function');
    expect(typeof cmp.goToAbout).toBe('function');
  });

  it('scrollToContact delegates to the shared SectionScroller', () => {
    const cmp = fixture.componentInstance as unknown as { scrollToContact: () => void };
    cmp.scrollToContact();
    expect(scrollTo).toHaveBeenCalledWith('contact');
  });
});
