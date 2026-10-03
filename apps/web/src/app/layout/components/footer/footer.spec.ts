import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Footer } from './footer';

@Component({ template: '' })
class BlankPage {}

async function setup(): Promise<{
  fixture: ComponentFixture<Footer>;
  offerLink: HTMLAnchorElement | null;
}> {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'offre-site-industrie', component: BlankPage }])],
  });
  const fixture = TestBed.createComponent(Footer);
  fixture.detectChanges();
  await fixture.whenStable();
  const offerLink = fixture.nativeElement.querySelector(
    '[data-testid="footer-offer-link"]',
  ) as HTMLAnchorElement | null;
  return { fixture, offerLink };
}

describe('Footer', () => {
  it('propose le lien « Sites pour ateliers » vers la page d’offre', async () => {
    const { offerLink } = await setup();
    expect(offerLink).toBeInstanceOf(HTMLAnchorElement);
    expect(offerLink?.getAttribute('href')).toBe('/offre-site-industrie');
    expect(offerLink?.textContent?.trim()).toBe('Sites pour ateliers');
  });

  it('range le lien d’offre après les liens légaux, dans la nav « Liens utiles »', async () => {
    const { offerLink } = await setup();
    const nav = offerLink?.closest('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Liens utiles');
    const hrefs = Array.from(nav?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/mentions-legales', '/confidentialite', '/offre-site-industrie']);
  });

  it('mène à la page d’offre au clic', async () => {
    const { fixture, offerLink } = await setup();
    expect(offerLink).toBeInstanceOf(HTMLAnchorElement);
    offerLink?.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/offre-site-industrie');
  });
});
