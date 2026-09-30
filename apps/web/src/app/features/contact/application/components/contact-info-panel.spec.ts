import { TestBed } from '@angular/core/testing';
import type { ContactInfo } from '@features/contact/domain/models/contact-info.model';
import type { SocialLinks } from '@features/contact/domain/models/social-link.model';
import { ContactInfoPanel } from './contact-info-panel';

const INFO: ContactInfo = { email: 'a@b.fr', phone: '06 00 00 00 00', location: 'Paris' };

const links = (overrides: Partial<SocialLinks> = {}): SocialLinks => ({
  linkedin: {
    url: 'https://www.linkedin.com/in/jdoe/',
    label: 'LinkedIn',
    icon: 'lucide-linkedin',
  },
  github: { url: 'https://github.com/jdoe', label: 'GitHub', icon: 'lucide-github' },
  email: { url: 'mailto:a@b.fr', label: 'Mail', icon: 'lucide-mail' },
  phone: { url: 'tel:+33600000000', label: 'Phone', icon: 'lucide-phone' },
  ...overrides,
});

describe('ContactInfoPanel', () => {
  const render = (socialLinks: SocialLinks = links()): HTMLElement[] => {
    const fixture = TestBed.createComponent(ContactInfoPanel);
    fixture.componentRef.setInput('contactInfo', INFO);
    fixture.componentRef.setInput('socialLinks', socialLinks);
    fixture.detectChanges();
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-testid="contact-channel"]',
      ),
    );
  };

  const row = (rows: HTMLElement[], key: string): HTMLElement | undefined =>
    rows.find((r) => r.textContent?.includes(key));

  it('Given toutes les coordonnées When le bloc est rendu Then cinq canaux dans l’ordre', () => {
    const keys = render().map((r) => r.querySelector('span')?.textContent?.trim());
    expect(keys).toEqual(['email', 'téléphone', 'linkedin', 'github', 'localisation']);
  });

  it.each([
    { key: 'linkedin', display: 'linkedin.com/in/jdoe' },
    { key: 'github', display: 'github.com/jdoe' },
  ])(
    'Given l’URL $key When le bloc est rendu Then elle s’affiche sans protocole ni www',
    ({ key, display }) => {
      expect(row(render(), key)?.textContent).toContain(display);
    },
  );

  it.each([
    { key: 'email', href: 'mailto:a@b.fr', external: false },
    { key: 'téléphone', href: 'tel:+33600000000', external: false },
    { key: 'linkedin', href: 'https://www.linkedin.com/in/jdoe/', external: true },
  ])(
    'Given le canal $key When le bloc est rendu Then le lien cible $href',
    ({ key, href, external }) => {
      const link = row(render(), key)?.querySelector('a');
      expect(link?.getAttribute('href')).toBe(href);
      expect(link?.getAttribute('target')).toBe(external ? '_blank' : null);
    },
  );

  it('Given la localisation When le bloc est rendu Then elle est affichée sans lien', () => {
    const location = row(render(), 'localisation');
    expect(location?.textContent).toContain('Paris');
    expect(location?.querySelector('a')).toBeNull();
  });

  it('Given un GitHub vide When le bloc est rendu Then la ligne GitHub disparaît', () => {
    const rows = render(links({ github: { url: '', label: 'GitHub', icon: 'lucide-github' } }));
    expect(row(rows, 'github')).toBeUndefined();
    expect(rows).toHaveLength(4);
  });
});
