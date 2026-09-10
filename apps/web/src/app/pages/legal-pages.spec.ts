import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { LegalNotice } from './legal-notice';
import { PrivacyPolicy } from './privacy-policy';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

describe('Pages légales', () => {
  it('les mentions légales nomment l\'éditeur, sa ville et ses contacts', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LegalNotice);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Mentions légales');
    expect(text).toContain('Julien Nédellec');
    expect(text).toContain(SITE_IDENTITY.location);
    expect(text).toContain(SITE_IDENTITY.phone.display);
    expect(
      (fixture.nativeElement.querySelector('[data-testid="legal-email"]') as HTMLAnchorElement).href,
    ).toBe(`mailto:${SITE_IDENTITY.email}`);
  });

  it('la politique de confidentialité couvre contact, audience, commentaires, erreurs et droits', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PrivacyPolicy);
    fixture.detectChanges();
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLElement>).map(
      (h) => h.textContent?.trim(),
    );
    expect(headings).toEqual([
      'Formulaire de contact',
      "Mesure d'audience",
      'Commentaires des articles',
      'Suivi des erreurs techniques',
      'Stockage local du navigateur',
      'Vos droits',
    ]);
    expect(fixture.nativeElement.textContent).toContain('30 jours');
  });
});
