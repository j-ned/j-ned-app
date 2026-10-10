import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { OFFER_PAGES } from '../../domain/offer-pages.static-data';
import { OfferHero } from './offer-hero';

const HERO = OFFER_PAGES['site-vitrine'].hero;

describe('OfferHero', () => {
  async function render(): Promise<{
    fixture: ComponentFixture<OfferHero>;
    opened: ReturnType<typeof vi.fn>;
  }> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(OfferHero);
    fixture.componentRef.setInput('hero', HERO);
    fixture.componentRef.setInput('priceTeaser', 'À partir de 900 €');
    const opened = vi.fn();
    fixture.componentInstance.requestOpened.subscribe(opened);
    await fixture.whenStable();
    return { fixture, opened };
  }

  const cta = (fixture: ComponentFixture<OfferHero>): HTMLAnchorElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector('[data-testid="offer-cta"]');

  it('Given the hero When « Demander mon site » is clicked Then the request is announced once, and the link still leads to the request form', async () => {
    const { fixture, opened } = await render();

    cta(fixture)?.click();
    await fixture.whenStable();

    expect({
      opened: opened.mock.calls.length,
      fragment: TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).fragment,
      tag: cta(fixture)?.tagName,
    }).toEqual({ opened: 1, fragment: 'demande', tag: 'A' });
  });
});
