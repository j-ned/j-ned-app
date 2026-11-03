import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { LegalNotice } from './legal-notice';
import { PrivacyPolicy } from './privacy-policy';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

describe('Pages légales', () => {
  it("les mentions légales nomment l'éditeur, sa ville et son adresse de contact", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LegalNotice);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Mentions légales');
    expect(text).toContain('Julien Nédellec');
    expect(text).toContain(SITE_IDENTITY.location);
    expect(
      (fixture.nativeElement.querySelector('[data-testid="legal-email"]') as HTMLAnchorElement)
        .href,
    ).toBe(`mailto:${SITE_IDENTITY.email}`);
  });

  it.each([
    { name: 'LegalNotice', page: LegalNotice },
    { name: 'PrivacyPolicy', page: PrivacyPolicy },
  ])('Given $name When la page est rendue Then elle n’émet aucun main', ({ page }) => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent<LegalNotice | PrivacyPolicy>(page);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')).not.toBeNull();
    expect(host.querySelectorAll('main')).toHaveLength(0);
  });
});
