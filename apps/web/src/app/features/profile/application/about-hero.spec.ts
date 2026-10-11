import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ProfileContent } from '../domain/models/profile-content.model';
import type { ProfileInfo, SocialButton } from '../domain/models/profile.model';
import { aProfileContent, aProfileInfo, aSocialButton } from '../testing/profile-builders';
import { AboutHero } from './about-hero';

const PROFILE = aProfileInfo();
const BIOGRAPHY = aProfileContent().biography;
const LEAD = 'Accroche témoin du premier écran.';
const SOCIALS: readonly SocialButton[] = [
  aSocialButton({ id: 'web', label: 'Réseau web', href: 'https://reseau.test/temoin' }),
  aSocialButton({ id: 'mail', label: 'Mail', icon: 'lucide-mail', href: 'mailto:temoin@test.fr' }),
];

type HeroInputs = {
  readonly profile: ProfileInfo | undefined;
  readonly biography: ProfileContent['biography'] | undefined;
  readonly socials: readonly SocialButton[];
};

describe('AboutHero', () => {
  let fixture: ComponentFixture<AboutHero>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const render = async ({ profile, biography, socials }: HeroInputs): Promise<void> => {
    fixture = TestBed.createComponent(AboutHero);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('lead', LEAD);
    fixture.componentRef.setInput('biography', biography);
    fixture.componentRef.setInput('socials', socials);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  describe('Given le profil, l’accroche, la biographie et les réseaux livrés', () => {
    beforeEach(async () => {
      await render({ profile: PROFILE, biography: BIOGRAPHY, socials: SOCIALS });
    });

    it('When le hero est rendu Then le nom est l’unique h1', () => {
      const headings = host().querySelectorAll('h1');
      expect(headings).toHaveLength(1);
      expect(headings[0].textContent?.trim()).toBe(PROFILE.displayName);
    });

    // Titre du premier écran : un fondu d'entrée (opacité nulle) le masque au premier rendu.
    it('When le hero est rendu Then le nom est visible au premier rendu, sans animation d’entrée', () => {
      const title = host().querySelector<HTMLElement>('[data-testid="about-title"]');
      expect(title).not.toBeNull();
      expect(title?.className).not.toMatch(/\banimate-/);
    });

    it('When le hero est rendu Then l’accroche reçue en entrée est suivie de son emphase', () => {
      const lead = host().querySelector('[data-testid="about-lead"]');
      expect(lead?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        `${LEAD} ${BIOGRAPHY.leadEmphasis}`,
      );
      expect(lead?.querySelector('span')?.textContent?.trim()).toBe(BIOGRAPHY.leadEmphasis);
    });

    it('When le hero est rendu Then seuls les liens web s’ouvrent dans un nouvel onglet', () => {
      const links = Array.from(
        host().querySelectorAll<HTMLAnchorElement>('[data-testid="about-social-link"]'),
      );
      expect(links.map((link) => [link.getAttribute('target'), link.getAttribute('rel')])).toEqual([
        ['_blank', 'noopener noreferrer'],
        [null, null],
      ]);
    });

    // Portrait = élément LCP : un fondu d'entrée repousse le LCP à la fin de l'animation.
    it('When le hero est rendu Then le portrait est visible au premier rendu, sans animation d’entrée', () => {
      const portrait = host().querySelector<HTMLElement>('[data-testid="about-portrait"]');
      expect(portrait).not.toBeNull();
      expect(portrait?.className).not.toMatch(/\banimate-/);
    });

    it('When le hero est rendu Then le portrait porte un texte alternatif', () => {
      expect(host().querySelector('img')?.getAttribute('alt')).toBe(
        `Portrait de ${PROFILE.displayName}`,
      );
    });
  });

  it.each([
    { cas: 'profil et biographie absents', profile: undefined, biography: undefined },
    { cas: 'profil absent', profile: undefined, biography: BIOGRAPHY },
    { cas: 'biographie absente', profile: PROFILE, biography: undefined },
  ])(
    'Given $cas, réseaux livrés When le hero est rendu Then seul le skeleton masqué est rendu, sans h1 ni lien',
    async ({ profile, biography }) => {
      await render({ profile, biography, socials: SOCIALS });

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
      fixture.componentRef.setInput('lead', LEAD);
      fixture.componentRef.setInput('biography', BIOGRAPHY);
      fixture.componentRef.setInput('socials', SOCIALS);
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
