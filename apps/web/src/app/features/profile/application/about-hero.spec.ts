import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { Biography } from '../domain/models/biography.model';
import type { ProfileInfo, SocialButton } from '../domain/models/profile.model';
import {
  STATIC_AVATAR_URL,
  STATIC_BIOGRAPHY,
  STATIC_PROFILE_BASE,
  STATIC_SOCIAL_BUTTONS,
} from '../infra/data/profile.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { AboutHero } from './about-hero';

const PROFILE: ProfileInfo = { ...STATIC_PROFILE_BASE, avatarUrl: STATIC_AVATAR_URL };

type HeroInputs = {
  readonly profile: ProfileInfo | undefined;
  readonly biography: Biography | undefined;
  readonly socials: readonly SocialButton[];
};

describe('AboutHero', () => {
  let fixture: ComponentFixture<AboutHero>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const render = async ({ profile, biography, socials }: HeroInputs): Promise<void> => {
    fixture = TestBed.createComponent(AboutHero);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('biography', biography);
    fixture.componentRef.setInput('socials', socials);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  describe('Given le profil, la biographie et les réseaux livrés', () => {
    beforeEach(async () => {
      await render({
        profile: PROFILE,
        biography: STATIC_BIOGRAPHY,
        socials: STATIC_SOCIAL_BUTTONS,
      });
    });

    it('When le hero est rendu Then le nom est l’unique h1', () => {
      const headings = host().querySelectorAll('h1');
      expect(headings).toHaveLength(1);
      expect(headings[0].textContent?.trim()).toBe(STATIC_PROFILE_BASE.displayName);
    });

    // Titre du premier écran : un fondu d'entrée (opacité nulle) le masque au premier rendu.
    it('When le hero est rendu Then le nom est visible au premier rendu, sans animation d’entrée', () => {
      const title = host().querySelector<HTMLElement>('[data-testid="about-title"]');
      expect(title).not.toBeNull();
      expect(title?.className).not.toMatch(/\banimate-/);
    });

    it('When le hero est rendu Then l’accroche et son emphase sont affichées', () => {
      const lead = host().querySelector('[data-testid="about-lead"]');
      expect(lead?.textContent).toContain(STATIC_BIOGRAPHY.lead);
      expect(lead?.querySelector('span')?.textContent?.trim()).toBe(STATIC_BIOGRAPHY.leadEmphasis);
    });

    it('When le hero est rendu Then seuls les liens web s’ouvrent dans un nouvel onglet', () => {
      const links = Array.from(
        host().querySelectorAll<HTMLAnchorElement>('[data-testid="about-social-link"]'),
      );
      expect(links).toHaveLength(STATIC_SOCIAL_BUTTONS.length);
      for (const link of links) {
        const external = link.getAttribute('href')?.startsWith('http') ?? false;
        expect(link.getAttribute('target')).toBe(external ? '_blank' : null);
        expect(link.getAttribute('rel')).toBe(external ? 'noopener noreferrer' : null);
      }
    });

    it('When le hero est rendu Then LinkedIn puis Malt suivent GitHub et s’ouvrent dans un nouvel onglet', () => {
      const links = Array.from(
        host().querySelectorAll<HTMLAnchorElement>('[data-testid="about-social-link"]'),
      );
      expect(links.map((link) => link.textContent?.trim())).toEqual([
        'GitHub',
        'LinkedIn',
        'Malt',
        'Mail',
        'Discord',
      ]);
      const linkedin = links[1];
      expect(linkedin.getAttribute('href')).toBe(SITE_IDENTITY.socials.linkedin);
      expect(linkedin.getAttribute('target')).toBe('_blank');
      const malt = links[2];
      expect(malt.getAttribute('href')).toBe(SITE_IDENTITY.socials.malt);
      expect(malt.getAttribute('target')).toBe('_blank');
    });

    // Portrait = élément LCP : un fondu d'entrée repousse le LCP à la fin de l'animation.
    it('When le hero est rendu Then le portrait est visible au premier rendu, sans animation d’entrée', () => {
      const portrait = host().querySelector<HTMLElement>('[data-testid="about-portrait"]');
      expect(portrait).not.toBeNull();
      expect(portrait?.className).not.toMatch(/\banimate-/);
    });

    it('When le hero est rendu Then le portrait porte un texte alternatif', () => {
      expect(host().querySelector('img')?.getAttribute('alt')).toBe(
        `Portrait de ${STATIC_PROFILE_BASE.displayName}`,
      );
    });
  });

  it.each([
    { cas: 'profil et biographie absents', profile: undefined, biography: undefined },
    { cas: 'profil absent', profile: undefined, biography: STATIC_BIOGRAPHY },
    { cas: 'biographie absente', profile: PROFILE, biography: undefined },
  ])(
    'Given $cas, réseaux livrés When le hero est rendu Then seul le skeleton masqué est rendu, sans h1 ni lien',
    async ({ profile, biography }) => {
      await render({ profile, biography, socials: STATIC_SOCIAL_BUTTONS });

      const section = host().querySelector('section');
      expect(section?.children).toHaveLength(1);
      expect(section?.children[0].getAttribute('aria-hidden')).toBe('true');
      expect(host().querySelectorAll('h1')).toHaveLength(0);
      expect(host().querySelectorAll('[data-testid="about-social-link"]')).toHaveLength(0);
      expect(host().querySelector('img')).toBeNull();
    },
  );

  describe('Given l’URL du CV', () => {
    beforeEach(async () => {
      fixture = TestBed.createComponent(AboutHero);
      fixture.componentRef.setInput('profile', PROFILE);
      fixture.componentRef.setInput('biography', STATIC_BIOGRAPHY);
      fixture.componentRef.setInput('socials', STATIC_SOCIAL_BUTTONS);
      fixture.componentRef.setInput('cvUrl', '/api/cv/download');
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('When le hero est rendu Then le lien CV s’ouvre dans un nouvel onglet et l’annonce dans son nom accessible', () => {
      const link = host().querySelector<HTMLAnchorElement>('[data-testid="about-hero-cv"]');

      expect([
        link?.getAttribute('href'),
        link?.getAttribute('target'),
        link?.getAttribute('aria-label'),
      ]).toEqual(['/api/cv/download', '_blank', 'Télécharger mon CV (PDF) (nouvel onglet)']);
    });
  });
});
