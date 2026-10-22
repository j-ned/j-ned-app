import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageNotFound } from './page-not-found';

describe('PageNotFound', () => {
  it('Given an unknown address When the page renders Then it tells the visitor, with tu, where to go next', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PageNotFound);
    await fixture.whenStable();
    const message = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="not-found-message"]',
    );

    expect(message?.textContent?.replace(/[ \t\r\n]+/g, ' ').trim()).toBe(
      "Oups\u202f! La page que tu cherches n'existe pas ou a été déplacée. Retourne à l'accueil ou fais un tour dans les autres sections du site.",
    );
  });

  it('Given an unknown address When the page renders Then the way home is drawn in the on-accent colour over the accent fill', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PageNotFound);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="not-found-home-link"]',
    );
    const colours = [...(link?.classList ?? [])].filter((token) =>
      /^(?:bg|text)-(?!(?:xs|sm|base|lg|\d*xl|left|center|right)$)/.test(token),
    );

    expect({ href: link?.getAttribute('href'), colours: colours.sort() }).toEqual({
      href: '/',
      colours: ['bg-primary-bg', 'text-on-primary'],
    });
  });
});
