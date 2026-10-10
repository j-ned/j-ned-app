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
        `Dernière mise à jour\u00A0: ${LEGAL_LAST_UPDATE}`,
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

  describe('mesure d’audience', () => {
    const renderPrivacy = (): HTMLElement => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(PrivacyPolicy);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };
    const paragraph = (host: HTMLElement, testId: string): string =>
      (host.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '')
        .replace(/[ \t\n\r]+/g, ' ')
        .trim();

    it.each([
      [
        'privacy-audience-pages',
        "La fréquentation est mesurée par un outil développé pour ce site, sans cookie ni identifiant persistant. Pour chaque page vue sont enregistrés\u00a0: la page (sans l'ancre éventuelle), la provenance (nom de domaine du site d'origine uniquement, une fois par visite), le pays déduit de l'adresse IP à partir d'une base locale, le navigateur, le système d'exploitation et le temps d'affichage de la page. L'adresse IP n'est jamais conservée\u00a0: elle sert seulement, combinée au navigateur et à la date du jour, à calculer une empreinte non réversible qui distingue les visites d'une même journée. Les visites des robots et de l'éditeur sont exclues.",
      ],
      [
        'privacy-audience-actions',
        "Certaines actions sont aussi comptées\u00a0: le clic sur un bouton d'appel, sur un lien de contact (e-mail, téléphone, Malt, Discord), de profil (LinkedIn, GitHub) ou de démonstration, l'arrivée sur le formulaire de l'accueil, l'envoi réussi du formulaire, le téléchargement du CV, l'ouverture et la lecture complète d'un article. Seuls le type d'action, son emplacement et la page sont enregistrés, jamais le contenu du formulaire ni l'adresse du lien.",
      ],
      [
        'privacy-audience-retention',
        "Base légale\u00a0: l'intérêt légitime à connaître l'usage du site. Les données brutes sont supprimées après 30 jours\u202f; seuls des totaux journaliers anonymes (visites, pages vues, visites engagées, rebonds, durée d'affichage cumulée, nombre d'actions par type) sont conservés au-delà.",
      ],
    ])('le paragraphe %s décrit la mesure réelle', (testId, expected) => {
      expect(paragraph(renderPrivacy(), testId)).toBe(expected);
    });

    it('date sa propre mise à jour, sans changer celle des mentions légales', () => {
      expect({
        privacy: paragraph(renderPrivacy(), 'privacy-last-update'),
        legal: LEGAL_LAST_UPDATE,
      }).toEqual({
        privacy: 'Dernière mise à jour\u00a0: 10 octobre 2026',
        legal: '3 octobre 2026',
      });
    });
  });

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
