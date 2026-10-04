import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { SectionScroller } from '@core/navigation/section-scroller';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from '../domain/home-hero.static-data';
import { STATIC_HERO } from '../infra/data/home.static-data';
import { HomeHeroSection } from './home-hero-section';

@Component({ template: '' })
class BlankPage {}

describe('HomeHeroSection', () => {
  let fixture: ComponentFixture<HomeHeroSection>;
  const trackCtaClick = vi.fn();
  const scrollTo = vi.fn();

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string, root: ParentNode = host()): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  const contactCta = (): HTMLElement | null => byTestId('hero-cta-contact');
  const clickContactCta = (): void => {
    const cta = contactCta();
    (cta?.querySelector('button') ?? cta)?.click();
  };

  beforeEach(async () => {
    trackCtaClick.mockClear();
    scrollTo.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'offres', component: BlankPage }]),
        { provide: AnalyticsGateway, useValue: { trackCtaClick } },
        { provide: SectionScroller, useValue: { scrollTo, eager: signal(false) } },
      ],
    });
    fixture = TestBed.createComponent(HomeHeroSection);
    fixture.componentRef.setInput('hero', STATIC_HERO);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('contact call to action', () => {
    it('invites the visitor to describe the project', () => {
      expect(contactCta()).not.toBeNull();
      expect(text(contactCta())).toBe(HOME_HERO_CTA_LABELS.contact);
    });

    it('scrolls to the contact form of the home page', () => {
      clickContactCta();
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith('contact');
    });

    it('tracks the click under the home_hero_contact id', () => {
      clickContactCta();
      expect(trackCtaClick).toHaveBeenCalledTimes(1);
      expect(trackCtaClick).toHaveBeenCalledWith('home_hero_contact', HOME_HERO_CTA_LABELS.contact);
    });
  });

  describe('offers call to action', () => {
    it('is a link to the offer catalogue, usable without JavaScript', () => {
      const link = byTestId('hero-cta-offers');
      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe('/offres');
      expect(text(link)).toBe(HOME_HERO_CTA_LABELS.offers);
    });

    it('leads to the offer catalogue when clicked', async () => {
      byTestId('hero-cta-offers')?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/offres');
    });

    it('tracks the click under the home_hero_offers id', () => {
      byTestId('hero-cta-offers')?.click();
      expect(trackCtaClick).toHaveBeenCalledWith('home_hero_offers', HOME_HERO_CTA_LABELS.offers);
    });
  });

  it('states the availability for clients as plain text, not as a link', () => {
    const availability = byTestId('hero-availability');
    expect(text(availability)).toBe(SITE_IDENTITY.availability);
    expect(availability?.closest('a')).toBeNull();
    expect(availability?.querySelector('a')).toBeNull();
  });

  describe('work frame', () => {
    const frame = (): HTMLElement | null => byTestId('hero-work-frame');

    it('is a group named after the frame title', () => {
      expect(frame()?.getAttribute('role')).toBe('group');
      expect(frame()?.getAttribute('aria-label')).toBe(HOME_WORK_FRAME.title);
    });

    it('shows the frame title and its reference', () => {
      expect(frame()).not.toBeNull();
      expect(text(byTestId('cartouche-title', frame() ?? host()))).toBe(HOME_WORK_FRAME.title);
      expect(text(byTestId('cartouche-reference', frame() ?? host()))).toBe(
        HOME_WORK_FRAME.reference,
      );
    });

    it('lists every row of the frame as a term and its value, in order', () => {
      expect(frame()).not.toBeNull();
      const rows = allByTestId('cartouche-row', frame() ?? host()).map((row) => ({
        label: text(byTestId('cartouche-label', row)),
        value: text(byTestId('cartouche-value', row)),
      }));
      expect(rows).toEqual(HOME_WORK_FRAME.rows);
    });

    it('is the only description list of the first screen', () => {
      const lists = Array.from(host().querySelectorAll('dl'));
      expect(lists).toHaveLength(1);
      expect(frame()?.contains(lists[0])).toBe(true);
    });

    it('draws a decorative dimension line hidden from assistive technologies', () => {
      const dimension = byTestId('hero-work-frame-dimension');
      expect(dimension?.getAttribute('aria-hidden')).toBe('true');
      expect(text(byTestId('dimension-line-label', dimension ?? host()))).toBe(
        HOME_WORK_FRAME.dimension,
      );
    });
  });
});
