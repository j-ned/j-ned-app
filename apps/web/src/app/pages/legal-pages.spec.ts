import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { LegalNotice } from './legal-notice';
import { PrivacyPolicy } from './privacy-policy';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { frenchTypographyViolations } from '../testing/french-typography-violations';

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

  describe('politique de confidentialité', () => {
    function renderPrivacyPolicy(): HTMLElement {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(PrivacyPolicy);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    const textOf = (host: HTMLElement, testId: string): string =>
      host.querySelector(`[data-testid="${testId}"]`)?.textContent?.replace(/\s+/g, ' ') ?? '';

    it.each([
      {
        testId: 'privacy-comments-data',
        mentions: ['nom ou pseudo', 'adresse e-mail', 'jamais publiée', 'message', 'empreinte'],
      },
      {
        testId: 'privacy-comments-purpose',
        mentions: ['relecture', 'te répondre', 'abus', 'intérêt légitime'],
      },
      { testId: 'privacy-comments-recipients', mentions: ['Resend'] },
      {
        testId: 'privacy-comments-retention',
        mentions: ['tant que', 'refus', 'supprim', 'article'],
      },
      { testId: 'privacy-comments-rights', mentions: ['suppression', SITE_IDENTITY.email] },
    ])(
      'Given the privacy policy When the comments section is read Then $testId names $mentions',
      ({ testId, mentions }) => {
        const text = textOf(renderPrivacyPolicy(), testId);

        expect(mentions.filter((mention) => !text.includes(mention))).toEqual([]);
      },
    );

    it('Given the privacy policy When it is read Then neither Giscus nor a GitHub account is mentioned for the comments', () => {
      const host = renderPrivacyPolicy();
      const comments = [...host.querySelectorAll('[data-testid^="privacy-comments-"]')]
        .map((paragraph) => paragraph.textContent ?? '')
        .join(' ');

      const links = [...host.querySelectorAll('a')].map((link) => link.href);

      expect({
        giscus:
          /giscus/i.test(host.textContent ?? '') || links.some((href) => /giscus/i.test(href)),
        github: /github/i.test(comments),
      }).toEqual({ giscus: false, github: false });
    });

    it('Given the privacy policy When the contact paragraph is read Then it no longer promises a confirmation to the sender, and names the mail provider', () => {
      const text = textOf(renderPrivacyPolicy(), 'privacy-contact');

      expect({ confirmation: /confirmation/i.test(text), resend: text.includes('Resend') }).toEqual(
        { confirmation: false, resend: true },
      );
    });

    it('Given the privacy policy When its text is read Then it follows French typography', () => {
      const host = renderPrivacyPolicy();

      expect(frenchTypographyViolations(host.textContent ?? '', 'privacy-policy')).toEqual([]);
    });
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
