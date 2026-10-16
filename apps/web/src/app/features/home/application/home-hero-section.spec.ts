import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from '../domain/home-hero.static-data';
import type { HeroData } from '../domain/models/hero.model';
import { STATIC_HERO } from '../infra/data/home.static-data';
import { HomeHeroSection } from './home-hero-section';

@Component({ template: '' })
class BlankPage {}

describe('HomeHeroSection', () => {
  let fixture: ComponentFixture<HomeHeroSection>;
  const contactRequested = vi.fn();
  const offersOpened = vi.fn();
  const bookingOpened = vi.fn();

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const allByTestId = (id: string, root: ParentNode = host()): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  const contactCta = (): HTMLElement | null => byTestId('hero-cta-contact');

  const render = async (hero: HeroData | null): Promise<void> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'offres', component: BlankPage },
          { path: 'rendez-vous', component: BlankPage },
        ]),
      ],
    });
    fixture = TestBed.createComponent(HomeHeroSection);
    fixture.componentRef.setInput('hero', hero);
    fixture.componentInstance.contactRequested.subscribe(contactRequested);
    fixture.componentInstance.offersOpened.subscribe(offersOpened);
    fixture.componentInstance.bookingOpened.subscribe(bookingOpened);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    contactRequested.mockClear();
    offersOpened.mockClear();
    bookingOpened.mockClear();
    await render(STATIC_HERO);
  });

  describe('contact call to action', () => {
    it('invites the visitor to describe the project', () => {
      expect(contactCta()).not.toBeNull();
      expect(text(contactCta())).toBe(HOME_HERO_CTA_LABELS.contact);
    });

    it('asks the page for the contact once, without opening the offers', () => {
      contactCta()?.click();
      expect(contactRequested).toHaveBeenCalledOnce();
      expect(offersOpened).not.toHaveBeenCalled();
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

    it('tells the page the offers were opened, once, without asking for the contact', () => {
      byTestId('hero-cta-offers')?.click();
      expect(offersOpened).toHaveBeenCalledOnce();
      expect(contactRequested).not.toHaveBeenCalled();
    });
  });

  describe('booking link', () => {
    const bookingLink = (): HTMLElement | null => byTestId('hero-booking-link');

    it('is a plain text link to the booking page, not a button', () => {
      const link = bookingLink();
      expect([link?.tagName, link?.getAttribute('href'), text(link)]).toEqual([
        'A',
        '/rendez-vous',
        HOME_HERO_CTA_LABELS.booking,
      ]);
      expect(link?.hasAttribute('appbutton')).toBe(false);
    });

    it('comes after both calls to action, which stay the only buttons-styled links', () => {
      const offers = byTestId('hero-cta-offers');
      const link = bookingLink();
      expect(link).not.toBeNull();
      expect(
        link ? (offers?.compareDocumentPosition(link) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(
        Array.from(host().querySelectorAll('[appbutton]')).map((el) =>
          el.getAttribute('data-testid'),
        ),
      ).toEqual(['hero-cta-contact', 'hero-cta-offers']);
    });

    it('leads to the booking page when clicked', async () => {
      bookingLink()?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/rendez-vous');
    });

    it('tells the page the booking was opened, once, without the other calls to action', () => {
      bookingLink()?.click();
      expect(bookingOpened).toHaveBeenCalledOnce();
      expect([contactRequested.mock.calls.length, offersOpened.mock.calls.length]).toEqual([0, 0]);
    });
  });

  it('offers the two calls to action and the booking link, and nothing else to follow', () => {
    expect(
      Array.from(host().querySelectorAll('a, button'), (el) => el.getAttribute('data-testid')),
    ).toEqual(['hero-cta-contact', 'hero-cta-offers', 'hero-booking-link']);
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
