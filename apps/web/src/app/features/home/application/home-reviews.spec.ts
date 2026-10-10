import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { makeReview } from '../testing/review-builders';
import { HomeReviews } from './home-reviews';

const REVIEWS = [
  makeReview({
    id: 'a',
    quote: 'Premier avis de test.',
    authorName: 'Auteur A',
    authorContext: 'Menuisier · Atelier A · Versailles',
  }),
  makeReview({
    id: 'b',
    quote: 'Second avis de test.',
    authorName: 'Auteur B',
    authorContext: 'Décolleteur · Atelier B · Trappes',
  }),
];

describe('HomeReviews', () => {
  let fixture: ComponentFixture<HomeReviews>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const byTestId = (testId: string, root: ParentNode = host()): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  const text = (el: Element | null): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  beforeEach(async () => {
    fixture = TestBed.createComponent(HomeReviews);
    fixture.componentRef.setInput('reviews', REVIEWS);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('Given real reviews When the section is rendered Then it is labelled by its h2 « Avis clients »', () => {
    const section = byTestId('home-reviews');
    const heading = section?.querySelector('h2') ?? null;

    expect(section?.tagName).toBe('SECTION');
    expect(text(heading)).toBe('Avis clients');
    expect(heading?.id).not.toBe('');
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('Given two reviews When the section is rendered Then each one is quoted with its author and context, in order', () => {
    const items = Array.from(host().querySelectorAll<HTMLElement>('[data-testid="home-review"]'));

    expect(
      items.map((item) => ({
        quote: text(byTestId('home-review-quote', item)),
        author: text(byTestId('home-review-author', item)),
        context: text(byTestId('home-review-context', item)),
      })),
    ).toEqual(
      REVIEWS.map(({ quote, authorName, authorContext }) => ({
        quote,
        author: authorName,
        context: authorContext,
      })),
    );
  });

  it('Given the section When it is rendered Then it ends on the Google review link, in a new tab, announced as such', () => {
    const link = byTestId('home-reviews-google');
    const items = host().querySelectorAll('[data-testid="home-review"]');

    expect([link?.getAttribute('href'), link?.getAttribute('target'), text(link)]).toEqual([
      SITE_IDENTITY.googleReviewUrl,
      '_blank',
      'Laisser un avis sur Google (nouvel onglet)',
    ]);
    expect((link?.getAttribute('rel') ?? '').split(/\s+/)).toContain('noopener');
    expect(
      (items[items.length - 1]?.compareDocumentPosition(link as Node) ?? 0) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
