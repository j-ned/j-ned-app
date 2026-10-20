import type { ContactInfo } from '@shared/identity/contact-info.model';
import type { SocialLinks } from '@shared/identity/social-link.model';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

export const STATIC_CONTACT_INFO: ContactInfo = {
  email: SITE_IDENTITY.email,
  location: SITE_IDENTITY.location,
};

export const STATIC_SOCIAL_LINKS: SocialLinks = {
  linkedin: { url: SITE_IDENTITY.socials.linkedin, label: 'LinkedIn', icon: 'lucide-linkedin' },
  github: { url: SITE_IDENTITY.socials.github, label: 'GitHub', icon: 'lucide-github' },
  email: { url: `mailto:${SITE_IDENTITY.email}`, label: 'Mail', icon: 'lucide-mail' },
};
