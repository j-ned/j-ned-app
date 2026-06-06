import type { ContactInfo, SocialLinks } from '@features/contact/domain';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

export const STATIC_CONTACT_INFO: ContactInfo = {
  email: SITE_IDENTITY.email,
  phone: SITE_IDENTITY.phone.display,
  location: SITE_IDENTITY.location,
};

export const STATIC_SOCIAL_LINKS: SocialLinks = {
  linkedin: { url: SITE_IDENTITY.socials.linkedin, label: 'LinkedIn', icon: 'lucide-linkedin' },
  github: { url: SITE_IDENTITY.socials.github, label: 'GitHub', icon: 'lucide-github' },
  email: { url: `mailto:${SITE_IDENTITY.email}`, label: 'Mail', icon: 'lucide-mail' },
  phone: { url: `tel:${SITE_IDENTITY.phone.tel}`, label: 'Phone', icon: 'lucide-phone' },
  twitter: { url: SITE_IDENTITY.socials.x, label: 'X', icon: 'lucide-twitter' },
};
