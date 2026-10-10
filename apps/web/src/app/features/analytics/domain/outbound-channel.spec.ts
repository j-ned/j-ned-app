import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { OutboundChannel } from './models/analytics.types';
import { outboundChannel } from './outbound-channel';

const SITE_URL = 'https://nedellec-julien.fr';

describe('outboundChannel', () => {
  it.each<[string, OutboundChannel]>([
    ['mailto:contact@nedellec-julien.fr', 'email'],
    ['mailto:contact@nedellec-julien.fr?subject=Projet', 'email'],
    ['tel:+33622869279', 'phone'],
    [SITE_IDENTITY.socials.malt, 'malt'],
    [SITE_IDENTITY.socials.discord, 'discord'],
    [SITE_IDENTITY.socials.linkedin, 'linkedin'],
    [SITE_IDENTITY.socials.github, 'github'],
    ['https://vieux-comptoir.nedellec-julien.fr/', 'demo'],
    ['https://coaching-life.nedellec-julien.fr/contact', 'demo'],
  ])('Given the link %s When it is classified Then its channel is %s', (href, channel) => {
    expect(outboundChannel(href, SITE_URL)).toBe(channel);
  });

  it.each<[string, string, OutboundChannel | null]>([
    ['the profile with a trailing slash', 'https://github.com/j-ned/', 'github'],
    ['a public repository', 'https://github.com/j-ned/ng-portfolio-app', 'demo'],
    [
      'a file inside a repository',
      'https://github.com/j-ned/ng-portfolio-app/blob/master/README.md',
      'demo',
    ],
    ['another account whose name starts like the profile', 'https://github.com/j-nedellec', null],
    ['another account', 'https://github.com/angular/angular', null],
  ])(
    'Given a GitHub link to %s When it is classified Then its channel is %s',
    (_label, href, channel) => {
      expect(outboundChannel(href, SITE_URL)).toBe(channel);
    },
  );

  it.each([
    ['the site itself', 'https://nedellec-julien.fr/blog'],
    ['the www host of the site', 'https://www.nedellec-julien.fr/'],
    ['the API host', 'https://api.nedellec-julien.fr/api/storage/cv.pdf'],
    ['a relative path', '/offres/site-vitrine'],
    ['a fragment', '#demande'],
    ['an unrelated site', 'https://www.cnil.fr'],
    ['a look-alike host ending with the site name', 'https://faux-nedellec-julien.fr/'],
    ['a host starting with the site name', 'https://nedellec-julien.fr.example.com/'],
  ])('Given %s When it is classified Then it is not an outbound channel', (_label, href) => {
    expect(outboundChannel(href, SITE_URL)).toBeNull();
  });
});
