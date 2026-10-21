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
});
