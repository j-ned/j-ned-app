import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Button } from '@shared/ui/button';
import { PageNotFound } from './page-not-found';

@Component({
  imports: [Button],
  template: '<a appButton data-testid="reference-button" href="/">Accueil</a>',
})
class PrimaryButtonReference {}

const sortedClasses = (element: Element | null): readonly string[] =>
  [...(element?.classList ?? [])].sort();

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

  it('Given an unknown address When the page renders Then the way home is the primary button, leading to the home page', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PageNotFound);
    const reference = TestBed.createComponent(PrimaryButtonReference);
    await fixture.whenStable();
    await reference.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="not-found-home-link"]',
    );
    const primary = (reference.nativeElement as HTMLElement).querySelector(
      '[data-testid="reference-button"]',
    );

    expect({ href: link?.getAttribute('href'), classes: sortedClasses(link) }).toEqual({
      href: '/',
      classes: sortedClasses(primary),
    });
  });
});
