import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { LEGAL_LAST_UPDATE, LegalNotice } from './legal-notice';
import { PrivacyPolicy } from './privacy-policy';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

describe('Pages légales', () => {
  it("les mentions légales nomment l'éditeur, sa ville et ses contacts", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LegalNotice);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Mentions légales');
    expect(text).toContain('Julien Nédellec');
    expect(text).toContain(SITE_IDENTITY.location);
    expect(text).toContain(SITE_IDENTITY.phone.display);
    expect(
      (fixture.nativeElement.querySelector('[data-testid="legal-email"]') as HTMLAnchorElement)
        .href,
    ).toBe(`mailto:${SITE_IDENTITY.email}`);
  });

  describe('éditeur professionnel', () => {
    const renderLegalNotice = (): HTMLElement => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(LegalNotice);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    it.each([
      ['legal-status', SITE_IDENTITY.business.status],
      ['legal-siret', SITE_IDENTITY.business.siret],
      ['legal-ape', SITE_IDENTITY.business.ape],
      ['legal-vat', SITE_IDENTITY.business.vatMention],
    ])('%s affiche la valeur de SITE_IDENTITY.business', (testId, expected) => {
      const element = renderLegalNotice().querySelector(`[data-testid="${testId}"]`);
      expect(element?.textContent?.trim()).toBe(expected);
    });

    it('présente Julien Nédellec comme entrepreneur individuel', () => {
      const editor = renderLegalNotice()
        .querySelector('[data-testid="legal-status"]')
        ?.closest('p');
      const sentence = editor?.textContent?.replace(/\s+/g, ' ').trim();
      expect(sentence).toContain(
        `Ce site est édité par Julien Nédellec, ${SITE_IDENTITY.business.status}`,
      );
    });

    it('date la dernière mise à jour du passage en version professionnelle', () => {
      expect(LEGAL_LAST_UPDATE).toBe('3 octobre 2026');
      expect(renderLegalNotice().textContent).toContain(
        `Dernière mise à jour : ${LEGAL_LAST_UPDATE}`,
      );
    });
  });

  it.each([
    { name: 'LegalNotice', page: LegalNotice },
    { name: 'PrivacyPolicy', page: PrivacyPolicy },
  ])(
    'Given $name When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host',
    ({ page }) => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent<LegalNotice | PrivacyPolicy>(page);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('h1')).not.toBeNull();
      expect(host.querySelectorAll('main')).toHaveLength(0);
      expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pb-16', 'pt-20']);
    },
  );

  it('la politique de confidentialité couvre contact, audience, commentaires, erreurs et droits', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PrivacyPolicy);
    fixture.detectChanges();
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('h2') as NodeListOf<HTMLElement>,
    ).map((h) => h.textContent?.trim());
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
