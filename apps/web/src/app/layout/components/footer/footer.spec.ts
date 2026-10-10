import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { Mock } from 'vitest';
import { SectionScroller } from '@core/navigation/section-scroller';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { offerPath } from '@features/offer/domain/offer-path';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { Footer } from './footer';
import { FOOTER_COPY } from './footer.static-data';

@Component({ template: '' })
class BlankPage {}

async function setup(): Promise<{
  fixture: ComponentFixture<Footer>;
  host: HTMLElement;
  scrollTo: ReturnType<typeof vi.fn>;
  scrollToRequestForm: ReturnType<typeof vi.fn>;
  trackCtaClick: Mock<AnalyticsGateway['trackCtaClick']>;
}> {
  const scrollTo = vi.fn();
  const scrollToRequestForm = vi.fn();
  const trackCtaClick = vi.fn<AnalyticsGateway['trackCtaClick']>();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: BlankPage }]),
      {
        provide: SectionScroller,
        useValue: { scrollTo, scrollToTop: vi.fn(), scrollToRequestForm },
      },
      { provide: AnalyticsGateway, useValue: stubAnalyticsGateway({ trackCtaClick }) },
    ],
  });
  const fixture = TestBed.createComponent(Footer);
  fixture.detectChanges();
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    scrollTo,
    scrollToRequestForm,
    trackCtaClick,
  };
}

const byTestId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string): T[] =>
  Array.from(root.querySelectorAll<T>(`[data-testid="${id}"]`));

const accessibleNameOf = (element: Element): string => {
  const label = element.getAttribute('aria-label');
  if (label) return label.trim();
  const labelledBy = element.getAttribute('aria-labelledby');
  if (!labelledBy) return '';
  return labelledBy
    .split(/\s+/)
    .map((id) => element.ownerDocument.getElementById(id)?.textContent?.trim() ?? '')
    .join(' ')
    .trim();
};

const collapsedText = (element: Element | undefined): string =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const navNameOf = (element: Element | undefined): string => {
  const nav = element?.closest('nav');
  return nav ? accessibleNameOf(nav) : '';
};

describe('Footer', () => {
  describe('copy', () => {
    it('pins every label of the footer', () => {
      expect(FOOTER_COPY).toEqual({
        tagline: 'Sites et applications web pour TPE, PME et ateliers. Yvelines et à distance.',
        headings: { offers: 'Offres', resources: 'Ressources', contact: 'Contact' },
        resources: { projects: 'Réalisations', blog: 'Blog', about: 'Parcours' },
        hiringLink: 'Vous recrutez\u202f?',
        contactCta: 'Décrire mon projet',
        socials: { malt: 'Malt', linkedin: 'LinkedIn', github: 'GitHub' },
        review: {
          prompt: 'Vous avez travaillé avec moi\u202f?',
          link: 'Laisser un avis sur Google',
          newTab: '(nouvel onglet)',
        },
        legal: {
          owner: 'Julien Nédellec',
          status: 'EI',
          siretLabel: 'SIRET',
          legalNotice: 'Mentions légales',
          privacy: 'Confidentialité',
        },
      });
    });

    it('Given the footer When it is rendered Then the tagline sits under the brand', async () => {
      const { host } = await setup();
      const [tagline] = byTestId(host, 'footer-tagline');

      expect(tagline?.textContent?.trim()).toBe(FOOTER_COPY.tagline);
    });

    it('Given the footer When it is rendered Then the columns are Offres, Ressources, Contact in that order', async () => {
      const { host } = await setup();
      const headings = byTestId(host, 'footer-column-heading').map((h) => h.textContent?.trim());

      expect(headings).toEqual([
        FOOTER_COPY.headings.offers,
        FOOTER_COPY.headings.resources,
        FOOTER_COPY.headings.contact,
      ]);
    });
  });

  describe('offer links', () => {
    it('Given the footer When it is rendered Then it links every offer of the catalogue by its short name, in catalogue order', async () => {
      const { host } = await setup();
      const links = byTestId<HTMLAnchorElement>(host, 'footer-offer-link');

      expect(links.map((link) => link.tagName)).toEqual(OFFERS.map(() => 'A'));
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        OFFERS.map((offer) => offerPath(offer.slug)),
      );
      expect(links.map((link) => link.textContent?.trim())).toEqual(
        OFFERS.map((offer) => offer.shortName),
      );
    });

    it('Given the offer links When they are rendered Then they live in the navigation named after the Offres column', async () => {
      const { host } = await setup();
      const links = byTestId(host, 'footer-offer-link');

      expect(links.map((link) => navNameOf(link))).toEqual(
        OFFERS.map(() => FOOTER_COPY.headings.offers),
      );
    });

    it.each(OFFERS.map((offer) => [offer.slug, offerPath(offer.slug)] as const))(
      'Given the %s link When it is clicked Then the router lands on %s',
      async (slug, path) => {
        const { fixture, host } = await setup();
        const link = byTestId<HTMLAnchorElement>(host, 'footer-offer-link').find(
          (candidate) => candidate.getAttribute('href') === offerPath(slug),
        );

        expect(link).toBeInstanceOf(HTMLAnchorElement);
        link?.click();
        await fixture.whenStable();
        expect(TestBed.inject(Router).url).toBe(path);
      },
    );
  });

  describe('hiring entry', () => {
    it('Given the footer When it is rendered Then « Vous recrutez ? » points to the hiring block of the Parcours page', async () => {
      const { host } = await setup();
      const links = byTestId<HTMLAnchorElement>(host, 'footer-hiring-link');

      expect(links).toHaveLength(1);
      expect(links[0]?.tagName).toBe('A');
      expect(links[0]?.getAttribute('href')).toBe('/about#recrutement');
      expect(links[0]?.textContent?.trim()).toBe(FOOTER_COPY.hiringLink);
      expect(navNameOf(links[0])).toBe(FOOTER_COPY.headings.resources);
    });

    it('Given « Vous recrutez ? » When it is clicked Then the router lands on the hiring anchor', async () => {
      const { fixture, host } = await setup();
      const [link] = byTestId<HTMLAnchorElement>(host, 'footer-hiring-link');

      expect(link).toBeInstanceOf(HTMLAnchorElement);
      link?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/about#recrutement');
    });
  });

  describe('resources column', () => {
    it('Given the footer When it is rendered Then Ressources lists Réalisations, Blog, Parcours then the hiring entry', async () => {
      const { host } = await setup();
      const nav = Array.from(host.querySelectorAll('nav')).find(
        (candidate) => accessibleNameOf(candidate) === FOOTER_COPY.headings.resources,
      );
      const links = Array.from(nav?.querySelectorAll('a') ?? []);

      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/projects',
        '/blog',
        '/about',
        '/about#recrutement',
      ]);
      expect(links.map((link) => link.textContent?.trim())).toEqual([
        FOOTER_COPY.resources.projects,
        FOOTER_COPY.resources.blog,
        FOOTER_COPY.resources.about,
        FOOTER_COPY.hiringLink,
      ]);
    });

    it.each(['/projects', '/blog', '/about'])(
      'Given the %s resource link When it is clicked Then the router lands on it',
      async (path) => {
        const { fixture, host } = await setup();
        const link = byTestId<HTMLAnchorElement>(host, 'footer-resource-link').find(
          (candidate) => candidate.getAttribute('href') === path,
        );

        expect(link).toBeInstanceOf(HTMLAnchorElement);
        link?.click();
        await fixture.whenStable();
        expect(TestBed.inject(Router).url).toBe(path);
      },
    );
  });

  describe('contact column', () => {
    it('Given the footer When it is rendered Then Contact starts with the call to action, inside the Contact navigation', async () => {
      const { host } = await setup();
      const ctas = byTestId(host, 'footer-contact-cta');
      const button =
        ctas[0] instanceof HTMLButtonElement ? ctas[0] : (ctas[0]?.querySelector('button') ?? null);

      expect(ctas).toHaveLength(1);
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button?.getAttribute('type')).toBe('button');
      expect(button?.textContent?.trim()).toBe(FOOTER_COPY.contactCta);
      expect(navNameOf(ctas[0])).toBe(FOOTER_COPY.headings.contact);
    });

    it('Given the call to action When it is clicked Then the SectionScroller leads to the form of the page, or else to the home contact', async () => {
      const { host, scrollTo, scrollToRequestForm } = await setup();
      const [cta] = byTestId(host, 'footer-contact-cta');
      const button = cta instanceof HTMLButtonElement ? cta : cta?.querySelector('button');

      expect(button).toBeInstanceOf(HTMLButtonElement);
      button?.click();
      expect(scrollToRequestForm).toHaveBeenCalledOnce();
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('Given the call to action When it is clicked Then the click is measured once under footer_contact, before scrolling', async () => {
      const { host, scrollToRequestForm, trackCtaClick } = await setup();

      byTestId<HTMLButtonElement>(host, 'footer-contact-cta')[0]?.click();

      expect(trackCtaClick.mock.calls).toEqual([['footer_contact', 'Décrire mon projet']]);
      expect(trackCtaClick.mock.invocationCallOrder[0]).toBeLessThan(
        scrollToRequestForm.mock.invocationCallOrder[0],
      );
    });

    it('Given the footer When it is rendered Then Malt, LinkedIn and GitHub open in a new tab from the Contact navigation', async () => {
      const { host } = await setup();
      const links = byTestId<HTMLAnchorElement>(host, 'footer-social-link');

      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        SITE_IDENTITY.socials.malt,
        SITE_IDENTITY.socials.linkedin,
        SITE_IDENTITY.socials.github,
      ]);
      expect(links.map((link) => link.textContent?.trim())).toEqual([
        FOOTER_COPY.socials.malt,
        FOOTER_COPY.socials.linkedin,
        FOOTER_COPY.socials.github,
      ]);
      expect(links.map((link) => link.getAttribute('target'))).toEqual([
        '_blank',
        '_blank',
        '_blank',
      ]);
      expect(
        links.map((link) => (link.getAttribute('rel') ?? '').split(/\s+/).sort().join(' ')),
      ).toEqual(['noopener noreferrer', 'noopener noreferrer', 'noopener noreferrer']);
      expect(links.map((link) => navNameOf(link))).toEqual([
        FOOTER_COPY.headings.contact,
        FOOTER_COPY.headings.contact,
        FOOTER_COPY.headings.contact,
      ]);
    });
  });

  describe('review invitation', () => {
    const reviewLink = (host: HTMLElement): HTMLAnchorElement | undefined =>
      byTestId<HTMLAnchorElement>(host, 'footer-review-link')[0];

    it('Given the footer When it is rendered Then the Contact column asks former clients, after the networks, without claiming any review', async () => {
      const { host } = await setup();
      const [prompt] = byTestId(host, 'footer-review-prompt');
      const socials = byTestId(host, 'footer-social-link');

      expect(prompt?.textContent?.replace(/[ \t\n\r]+/g, ' ').trim()).toBe(
        'Vous avez travaillé avec moi\u202f?',
      );
      expect(navNameOf(prompt)).toBe(FOOTER_COPY.headings.contact);
      expect(
        (socials[socials.length - 1]?.compareDocumentPosition(prompt as Node) ?? 0) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('Given the footer When it is rendered Then the review link opens the Google review form in a new tab, without opener', async () => {
      const link = reviewLink((await setup()).host);

      expect(link?.getAttribute('href')).toBe(SITE_IDENTITY.googleReviewUrl);
      expect(link?.getAttribute('target')).toBe('_blank');
      expect((link?.getAttribute('rel') ?? '').split(/\s+/)).toContain('noopener');
      expect(navNameOf(link)).toBe(FOOTER_COPY.headings.contact);
    });

    it('Given the review link When it is read by assistive technologies Then its name announces the new tab', async () => {
      const link = reviewLink((await setup()).host);

      expect(link?.textContent?.replace(/[ \t\n\r]+/g, ' ').trim()).toBe(
        'Laisser un avis sur Google (nouvel onglet)',
      );
    });

    it('Given the review link When it is clicked Then the click is measured once under review_google', async () => {
      const { host, trackCtaClick } = await setup();
      const link = reviewLink(host);
      link?.addEventListener('click', (event) => event.preventDefault());

      link?.click();

      expect(trackCtaClick).toHaveBeenCalledExactlyOnceWith(
        'review_google',
        'Laisser un avis sur Google',
      );
    });
  });

  describe('legal line', () => {
    afterEach(() => vi.useRealTimers());

    it('Given the date When the footer is rendered Then the legal line states year, owner, status, SIRET and VAT mention', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-04T12:00:00Z'));
      const { host } = await setup();

      expect(collapsedText(byTestId(host, 'footer-legal-mention')[0])).toBe(
        `© 2026 Julien Nédellec · EI · SIRET ${SITE_IDENTITY.business.siret} · ${SITE_IDENTITY.business.vatMention}`,
      );
    });

    it('Given the legal line When it is rendered Then it carries the legal notice and privacy links', async () => {
      const { host } = await setup();
      const [legal] = byTestId(host, 'footer-legal');
      const links = byTestId(host, 'footer-legal-link');

      expect(legal).toBeInstanceOf(HTMLElement);
      expect(links).toHaveLength(2);
      expect(links.map((link) => legal?.contains(link))).toEqual([true, true]);
    });
  });

  describe('legal links', () => {
    it('Given the footer When it is rendered Then it links the legal notice then the privacy policy', async () => {
      const { host } = await setup();
      const links = byTestId<HTMLAnchorElement>(host, 'footer-legal-link');

      expect(links.map((link) => link.tagName)).toEqual(['A', 'A']);
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/mentions-legales',
        '/confidentialite',
      ]);
      expect(links.map((link) => link.textContent?.trim())).toEqual([
        FOOTER_COPY.legal.legalNotice,
        FOOTER_COPY.legal.privacy,
      ]);
    });

    it('Given the legal notice link When it is clicked Then the router lands on it', async () => {
      const { fixture, host } = await setup();
      const [legalNotice] = byTestId<HTMLAnchorElement>(host, 'footer-legal-link');

      expect(legalNotice).toBeInstanceOf(HTMLAnchorElement);
      legalNotice?.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/mentions-legales');
    });
  });

  describe('landmarks', () => {
    it('Given the footer When it is rendered Then its host holds one footer and no other top-level landmark', async () => {
      const { host } = await setup();

      expect(Array.from(host.children).map((el) => el.tagName.toLowerCase())).toEqual(['footer']);
      expect(host.querySelectorAll('main, header, aside')).toHaveLength(0);
    });

    it('Given the footer navigations When they are rendered Then each one has its own non-empty name', async () => {
      const { host } = await setup();
      const names = Array.from(host.querySelectorAll('nav')).map((nav) => accessibleNameOf(nav));

      expect(names).toEqual(expect.arrayContaining(Object.values(FOOTER_COPY.headings)));
      expect(names.filter((name) => name === '')).toEqual([]);
      expect(new Set(names).size).toBe(names.length);
    });
  });
});
