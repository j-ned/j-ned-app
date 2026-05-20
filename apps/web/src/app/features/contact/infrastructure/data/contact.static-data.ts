import type { ContactInfo, SocialLinks } from '../../domain';

export const STATIC_CONTACT_INFO: ContactInfo = {
  email: 'contact@nedellec-julien.fr',
  phone: '06 22 86 92 79',
  location: 'Paris, France',
};

export const STATIC_SOCIAL_LINKS: SocialLinks = {
  linkedin: { url: '', label: '', icon: '' },
  github: { url: 'https://github.com/j-ned', label: 'GitHub', icon: 'lucide-github' },
  email: { url: 'mailto:contact@julien-nedellec.fr', label: 'Mail', icon: 'lucide-mail' },
  phone: { url: '', label: '', icon: '' },
  twitter: { url: '', label: '', icon: '' },
};
