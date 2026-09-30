import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ProfileGateway } from '../domain/gateways/profile.gateway';
import {
  STATIC_BIOGRAPHY,
  STATIC_PROFILE_BASE,
  STATIC_SOCIAL_BUTTONS,
} from '../infra/data/profile.static-data';
import { fakeProfileGateway } from '../testing/fake-profile-gateway';
import { AboutHero } from './about-hero';

describe('AboutHero', () => {
  let fixture: ComponentFixture<AboutHero>;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProfileGateway, useFactory: fakeProfileGateway }],
    });
    fixture = TestBed.createComponent(AboutHero);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('Given le profil livré When le hero est rendu Then le nom est l’unique h1', () => {
    const headings = host().querySelectorAll('h1');
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent?.trim()).toBe(STATIC_PROFILE_BASE.displayName);
  });

  it('Given la biographie When le hero est rendu Then l’accroche et son emphase sont affichées', () => {
    const lead = host().querySelector('[data-testid="about-lead"]');
    expect(lead?.textContent).toContain(STATIC_BIOGRAPHY.lead);
    expect(lead?.querySelector('span')?.textContent?.trim()).toBe(STATIC_BIOGRAPHY.leadEmphasis);
  });

  it('Given les réseaux When le hero est rendu Then seuls les liens web s’ouvrent dans un nouvel onglet', () => {
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

  it('Given le portrait When le hero est rendu Then il porte un texte alternatif', () => {
    expect(host().querySelector('img')?.getAttribute('alt')).toBe(
      `Portrait de ${STATIC_PROFILE_BASE.displayName}`,
    );
  });
});
